# -*- coding: utf-8 -*-
import alp
from alp import Item
from unidecode import unidecode
from sys import argv as sys_argv
from initdb import get_list

def cmd_arg(a):
    return 'cmd:' + a

def url_arg(u):
    return 'url:' + u

def cmd_title(c):
    return 'pp > ' + c

def main():
    cmds = {
        'init': 'initialize the DB',
        'readme': 'show the project\'s README'
    }

    argv = sys_argv
    argc = len(argv)
    items = []

    if argc > 1:
        argv = argv[:1] + argv[1].split()
        argc = len(argv)

    if argv[1] == '>':
        if argc > 2:
            for c in alp.fuzzy_search(argv[2], cmds.keys()):
                t = cmd_title(c)
                i = Item(title=t, autocomplete='> '+c, \
                            subtitle=cmds[c], valid=True, arg=cmd_arg(c))
                items.append(i)
        else:
            for c, st in cmds.iteritems():
                t = cmd_title(c)
                i = Item(title=t, autocomplete='> '+c, \
                            subtitle=st, valid=True, arg=cmd_arg(c))
                items.append(i)
        alp.feedback(items)
        return

    li = get_list()

    for p in li:
        if 'fuzzy' not in p:
            p['fuzzy'] = p['name']

    u2ascii = lambda s: unidecode(s.decode('utf-8'))

    qry = ' '.join(map(u2ascii, argv[1:])).strip()

    ppl = alp.fuzzy_search(qry, li, lambda x: x['fuzzy'])

    for p in ppl:
        kw = {}
        kw['title'] = p['name']
        kw['autocomplete'] = p['name']
        kw['subtitle'] = p['info'] if 'info' in p else ''
        if 'url' in p:
            kw['valid'] = True
            kw['arg'] = url_arg(p['url'])
        else:
            kw['valid'] = False

        if 'icon' in p:
            kw['icon'] = alp.local('icons/'+p['icon'])
            #kw['fileIcon'] = True

        items.append(Item(**kw))

    alp.feedback(items)

if __name__ == '__main__':
    main()
