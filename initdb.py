# -*- coding: utf-8 -*-
"""
This module provide utilities to update the local list of people. This list is
stored as JSON in people.json, and each person is a dict with these keys:
'name' (the person name), 'url' (its personal page URL), 'icon' (an icon
path), 'info' (more info about this person; may be empty), and an optional key,
'fuzzy', which can be used for fuzzy matching.
"""

import re
import alp
from alp import Request
from unidecode import unidecode
from urlparse import urljoin

JSON_LIST='people.json'

def fmt_phone(ph):
    """
    Format a (French) phone number
    """
    ph = re.sub('^(\+?33\s(?:\(?0\)?))', '0', ph)
    return re.sub('(?<=\d)[-. ](?=\d)', '.', ph).strip()

def fmt_name(n):
    """
    Format a name
    """
    return re.sub(u'([ÉA-Z]{2,})', lambda m: m.group(1).capitalize(), n)

def text(el):
    """
    Helper to get the text content of a BeautifulSoup item
    """
    return el.get_text().strip()

def mk_fuzzy(p):
    """
    Return the 'fuzzy' field of a person dict. This is a string containing
    various versions of the person's name for easier searches.
    """
    els = []
    els.append(p['name'])
    els.append(unidecode(p['name']))
    if 'url' in p:
        urlname = re.search('/~(\w+)', p['url'])
        if urlname:
            els.append(urlname.group(1))

    # siglum, e.g. Foo Bar-Qux -> fbq
    sig = ''.join(re.findall(u'[A-ZÉ]', p['name']))
    if sig:
        els.append(sig)

    return ' # '.join(els)

def parse_liafa():
    """
    Return a list of people from LIAFA.
    """
    alp.log('parsing liafa')
    icon = 'liafa.png'
    people_list = []
    base = 'http://www.liafa.univ-paris-diderot.fr/'
    tr_sel = 'blockquote > table tr.fondgristresc' # td:first-child a'
    page = Request(urljoin(base, '/web9/membreliafa/listalpha_fr.php'))
    page.download()
    page = page.souper()
    for tr in page.select(tr_sel):
        links = tr.select('td a')
        if (len(links) == 0):
            continue

        u = links[0].get('href')
        if u == None:
            continue
        p = {}
        tds = tr.select('td.texte')
        if len(tds) >= 2:
            p['info'] = 'Office ' + text(tds[1]) \
                      + ', phone: ' + fmt_phone(text(tds[0]))
        page = Request(base + u)
        page.download()
        page = page.souper()
        pp = page.select('table.texte li a.bleu')
        if (pp):
            pp = pp[0]
            p['url'] = urljoin(base, pp.get('href'))
            p['name'] = fmt_name(text(page.select('blockquote h2')[0]))
            p['icon'] = icon
            p['fuzzy'] = mk_fuzzy(p)
            people_list.append(p)

    alp.log('done liafa')
    return people_list


def parse_pps():
    """
    Return a list of people from PPS
    """
    alp.log('parsing pps')
    icon = 'pps.png'
    people_list = []
    base = 'http://www.pps.univ-paris-diderot.fr'
    page = Request(base + '/membres')
    page.download()
    page = page.souper()
    trs = page.select('#contenu2 table')[0].find_all('tr')[1:]

    for tr in trs:
        link = tr.find('a')
        if not link:
            continue
        p = {}
        p['url']  = urljoin(base, link.get('href'))
        p['name'] = fmt_name(text(link))
        p['fuzzy'] = mk_fuzzy(p)
        p['icon'] = icon

        tds = tr.find_all('td')
        if (len(tds) >= 4):
            p['info']  = 'Office ' + text(tds[2]) \
                       + ', phone: ' + fmt_phone('01 57 27 ' + text(tds[3]))

        people_list.append(p)

    alp.log('done pps')
    return people_list

def parse_gallium():
    """
    Return a list of people from Gallium. Only a part of them are teaching
    at Paris Diderot.
    """
    alp.log('parsing gallium')
    icon = 'inria.png'
    people_list = []
    base = 'http://gallium.inria.fr'
    page = Request(base + '/members.html')
    page.download()
    page = page.souper()
    links = page.select('#columnA_2columns a')
    for link in links:
        p = { 'name': text(link), 'url': urljoin(base, link.get('href')) }
        p['icon'] = icon
        p['fuzzy'] = mk_fuzzy(p)
        people_list.append(p)

    alp.log('done gallium')
    return people_list

def parse_others():
    """
    Return a list of manually-added people
    """
    alp.log('parsing others')
    li = alp.jsonLoad(alp.local('others.json'), [])
    for p in li:
        if 'fuzzy' not in p:
            p['fuzzy'] = mk_fuzzy(p)
    alp.log('done others')
    return li

def parse_all():
    return parse_liafa()+parse_pps()+parse_gallium()+parse_others()

def save_list():
    p = parse_all()
    alp.jsonDump(p, JSON_LIST)
    return p

def get_list():
    li = alp.jsonLoad(JSON_LIST, default=[])
    if len(li) == 0:
        return save_list()
    return li
