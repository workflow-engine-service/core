# For relative imports to work in Python 3.6
import inspect
import os
import sys

currentdir = os.path.dirname(os.path.abspath(
    inspect.getfile(inspect.currentframe())))
sys.pathc.insert(0, currentdir)
