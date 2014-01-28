import alp
import sys
from initdb import save_list
from subprocess import Popen

def do_cmd(cmd):
    if cmd == 'init':
        n = len(save_list())
        title = 'Alfred PP'
        subtitle = 'People database updated'
        text = str(n) + ' teachers in the database.'
        n = alp.Notification()
        n.notify(title, subtitle, text)
    elif cmd == 'readme':
        go_url('https://github.com/bfontaine/alfred-pp#readme')

def go_url(u):
    Popen(['osascript', '-e', 'open location "%s"' % u])

def main():
    if len(sys.argv) < 2:
        return

    typ, arg = sys.argv[1].split(':', 1)

    if typ == 'cmd':
        return do_cmd(arg)
    elif typ == 'url':
        return go_url(arg)

if __name__ == '__main__':
    main()
