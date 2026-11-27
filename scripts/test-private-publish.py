import importlib.util, json, unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('publish',Path(__file__).with_name('private-publish.py')); m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Gate(unittest.TestCase):
    def test_privacy(self):
        base={'full_name':m.REPO,'private':True,'visibility':'private','permissions':{'push':True}}
        for change in [{'private':False},{'visibility':'public'},{'permissions':{}},{'full_name':'another/repo'},{'private':None}]:
            with self.subTest(change=change),patch.object(m,'run',return_value=json.dumps(base|change)):
                with self.assertRaises(RuntimeError):m.private_repo()
        with patch.object(m,'run',return_value=json.dumps(base)):m.private_repo()
    def test_explicit_public(self):
        base={'full_name':m.REPO,'private':False,'visibility':'public','permissions':{'push':True}}
        with patch.object(m,'run',return_value=json.dumps(base)):
            with self.assertRaises(RuntimeError):m.private_repo()
            m.private_repo(True)
        for change in [{'private':True},{'visibility':'private'},{'permissions':{}},{'full_name':'another/repo'}]:
            with self.subTest(change=change),patch.object(m,'run',return_value=json.dumps(base|change)):
                with self.assertRaises(RuntimeError):m.private_repo(True)
    def test_api_failure(self):
        with patch.object(m,'run',side_effect=OSError('unavailable')):
            with self.assertRaises(OSError):m.private_repo()
if __name__=='__main__':unittest.main()
