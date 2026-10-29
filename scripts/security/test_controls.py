import pathlib,tempfile,unittest
from unittest.mock import patch
import dependencies,check_access

class InventoryTests(unittest.TestCase):
    def test_scoped_package(self):
        self.assertEqual(dependencies.dependency('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js'),('@supabase/supabase-js','2.118.0'))
    def test_unsupported_hosts_and_http(self):
        for value in ['http://cdn.jsdelivr.net/npm/jspdf@2.5.2','https://other.invalid/library.js']:
            with self.assertRaises(ValueError):dependencies.dependency(value)
    def test_fixed_floating_jsr_and_local_ignored(self):
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory)
            (root/'index.html').write_text('<script src="local.js"></script><script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2"></script><script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>')
            (root/'edge.ts').write_text('import { x } from "jsr:@supabase/server@^1";')
            r=dependencies.inventory(root)
            self.assertEqual(r['dependencies'],{'jspdf':'2.5.2','@supabase/supabase-js':'2'})
            self.assertEqual(len(r['floating']),1);self.assertEqual(len(r['jsr_not_audited_by_npm']),1)
    def test_multiple_versions_fail_coverage(self):
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory)
            (root/'index.html').write_text('<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2"></script><script src="https://cdn.jsdelivr.net/npm/jspdf@4.2.1"></script>')
            r=dependencies.inventory(root)
            self.assertTrue(r['unsupported']);self.assertNotIn('jspdf',r['dependencies'])

class AccessTests(unittest.TestCase):
    def setUp(self):
        self.fixtures={'project_url':'https://example.supabase.co',
          'A':{'code':'A','management_token':'11111111-1111-4111-8111-111111111111','team_name':'AUDIT-A'},
          'B':{'code':'B','management_token':'22222222-2222-4222-8222-222222222222','team_name':'AUDIT-B'}}
    def call(self,base,key,function,payload):
        if function=='rebond_retrouver_session':return 403,{'message':'Accès refusé'}
        for item in [self.fixtures['A'],self.fixtures['B']]:
            if payload['p_session_code']==item['code'] and payload['p_management_token']==item['management_token']:
                return 200,[{'team_name':item['team_name']}]
        return 400,{'code':'P0001','message':'Accès refusé'}
    def test_all_seventeen_checks(self):
        r=check_access.verify(self.fixtures,'sb_publishable_TEST',self.call)
        self.assertEqual(len(r),17);self.assertTrue(all(x['conforme'] for x in r))
    def test_key_leak_detected_without_printing_key(self):
        def leaky(base,key,function,payload):
            if function=='rebond_retrouver_session':return 200,[{'management_token':self.fixtures['A']['management_token']}]
            return self.call(base,key,function,payload)
        result=check_access.verify(self.fixtures,'sb_publishable_TEST',leaky)
        self.assertFalse(result[-1]['conforme'])
        self.assertNotIn(self.fixtures['A']['management_token'],str(result))
    def test_missing_positive_fixture_fails(self):
        def absent(*args):return 400,{'code':'P0001','message':'Accès refusé'}
        result=check_access.verify(self.fixtures,'sb_publishable_TEST',absent)
        self.assertFalse(result[0]['conforme']);self.assertFalse(result[1]['conforme'])
    def test_network_failure_not_a_success(self):
        def broken(*args):raise check_access.urllib.error.URLError('test')
        with self.assertRaises(check_access.urllib.error.URLError):check_access.verify(self.fixtures,'sb_publishable_TEST',broken)
    def test_privileged_key_rejected(self):
        with self.assertRaises(ValueError):check_access.verify(self.fixtures,'sb_secret_TEST',self.call)

if __name__=='__main__':unittest.main()
