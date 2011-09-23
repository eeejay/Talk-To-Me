#!/usr/bin/env python

from optparse import OptionParser
import sys, subprocess, os
import shlex
import re

parser = OptionParser()
parser.add_option("--adb", dest="adb",
                  help="ADB command path", default="adb")
parser.add_option("--pkg-name", dest="pkg_name", default="org.mozilla.fennec",
                  help="Android package name")


def _print_help_and_exit():
    parser.print_help()
    sys.exit(1)

def _run_cmd(cmd):
    return subprocess.Popen(shlex.split(cmd),
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE).communicate()

def _run_android_cmd(adb, cmd):
    return subprocess.Popen([adb, 'shell', cmd],
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE).communicate()

def _path_not_exists(adb, path):
    res, _ = _run_android_cmd(adb, 'ls %s' % path)
    return "No such file or directory" in res

if __name__ == "__main__":
    (options, args) = parser.parse_args()

    if not args:
        _print_help_and_exit()

    if args[0] == "command":
        _run_android_cmd(options.adb, ' '.join(args[1:]))
    elif args[0] == "start":
        _run_android_cmd(options.adb,
                         "am start -a android.activity.MAIN -n %s/%s.App" %
                         (options.pkg_name, options.pkg_name))
    elif args[0] == "kill":
        procs, _ = _run_android_cmd(options.adb, "ps")
        for proc in procs.split('\n'):
            if options.pkg_name in proc:
                pid = re.split(r'\s+', proc)[1]
                _run_android_cmd(options.adb, "kill %s" % pid)
    elif args[0] == "mkdirs":
        p = args[1]
        if not os.path.isabs(p):
            sys.exit(1)
        for i in xrange(2, len(p.split(os.path.sep)) + 1):
            currpath = '/'.join(p.split(os.path.sep)[:i])
            print currpath, _path_not_exists(options.adb, currpath)
            if _path_not_exists(options.adb, currpath):
                 print _run_android_cmd(options.adb, "mkdir %s" % currpath)
