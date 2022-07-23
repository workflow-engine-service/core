# For relative imports to work in Python 3.6
import inspect
import os
import sys
sys.path.append(os.path.dirname(os.path.realpath(__file__)))
sys.path.append('../lib')
sys.path.append(os.path.dirname(os.path.realpath(__file__)))
# sys.path.append('..')

currentdir = os.path.dirname(os.path.abspath(
    inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
sys.path.insert(0, parentdir)


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
