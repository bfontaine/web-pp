# -*- coding: utf-8 -*-
"""
This module provide utilities to update the local list of people. This list is
stored as JSON in Redis and served through /json, each person is a dict with
the following keys: 'name' (the person name), 'url' (its personal page URL),
'icon' (an icon path), 'info' (more info about this person; may be empty), and
an optional key, 'fuzzy', which can be used for fuzzy matching.

.save_list should be called each day/week/month by a scheduler to update
people.json.
"""

import re
import json
from store import redis
from bs4 import BeautifulSoup
from unidecode import unidecode
from urllib2 import urlopen, Request
from urlparse import urljoin, urlparse


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
    n = n.strip()
    return re.sub(u'([ÉÈËÊÑA-Z]{2,})', lambda m: m.group(1).capitalize(), n)


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

    # join with non-\w symbol to avoid cross-matching
    return ' # '.join(els)


def soup_url(url):
    """
    Get an HTML document from an URL, and return its (beautiful) soup
    """
    req = Request(url, headers={'User-Agent': 'p7pp/web'})
    html = urlopen(req).read()
    return BeautifulSoup(html, "lxml")


def mk_people_key(org, url):
    """
    Make a key for a person, using their org and their webpage URL
    """
    path = urlparse(url).path
    m = re.match(r'^/~(\w+)', path)
    key = m.group(1) if m else re.sub(r'\W', '_', path)
    return "people.%s.%s" % (org, key)


def parse_liafa():
    """
    Return a dict of people from LIAFA.
    """
    print "parsing LIAFA..."
    icon = 'liafa'
    people = {}
    base = 'http://www.liafa.univ-paris-diderot.fr/'
    tr_sel = 'blockquote > table tr.fondgristresc'  # td:first-child a'
    souper = soup_url(urljoin(base, '/web9/membreliafa/listalpha_fr.php'))
    for tr in souper.select(tr_sel):
        links = tr.select('td a')
        if (len(links) == 0):
            continue

        u = links[0].get('href')
        if u is None:
            continue
        p = {}
        tds = tr.select('td.texte')
        if len(tds) >= 2:
            p['info'] = ''
            office = text(tds[1])
            phone = text(tds[0])
            if office and phone and (office != '-' or phone != '-'):
                p['info'] = 'Office ' + office + ', phone: ' + fmt_phone(phone)
        souper = soup_url(base + u)
        pp = souper.select('table.texte li a.bleu')
        if (pp):
            pp = pp[0]
            p['url'] = urljoin(base, pp.get('href'))
            p['name'] = fmt_name(text(souper.select('blockquote h2')[0]))
            p['icon'] = icon
            p['fuzzy'] = mk_fuzzy(p)

            people[mk_people_key('liafa', p['url'])] = p

    return people


def parse_pps():
    """
    Return a dict of people from PPS
    """
    print "parsing PPS..."
    icon = 'pps'
    people = {}
    base = 'http://www.pps.univ-paris-diderot.fr'
    souper = soup_url(base + '/membres')
    trs = souper.select('#contenu2 table')[0].find_all('tr')[1:]

    for tr in trs:
        link = tr.find('a')
        if not link:
            continue
        p = {}
        p['url'] = urljoin(base, link.get('href'))
        p['name'] = fmt_name(text(link))
        p['fuzzy'] = mk_fuzzy(p)
        p['icon'] = icon

        tds = tr.find_all('td')
        if (len(tds) >= 4):
            p['info'] = ''
            office = text(tds[2])
            phone = text(tds[3])
            if office and phone and (office != '-' or phone != '-'):
                p['info'] = 'Office ' + office \
                    + ', phone: ' + fmt_phone('01 45 27 ' + phone)

        people[mk_people_key('pps', p['url'])] = p

    print "parsing PPS (pi.r2)..."
    souper = soup_url(base + '/pi.r2/Members')
    lis = souper.select('.members')[0].find_all('li')
    for li in lis:
        link = li.find('a')
        name = li.find('strong')
        if not link or not name:
            continue
        p = {}
        p['url'] = link.get('href')
        p['name'] = fmt_name(text(name))
        p['fuzzy'] = mk_fuzzy(p)
        p['icon'] = icon
        p['info'] = ''
        # we keep the same key to avoid potential duplicates
        key = mk_people_key('pps', p['url'])
        if key in people:
            print "%s is already at PPS, skipping" % p['name']
            continue

        people[key] = p

    return people


def parse_gallium():
    """
    Return a dict of people from Gallium. Only a part of them are teaching
    at Paris Diderot.
    """
    print "parsing Gallium..."
    icon = 'inria'
    people = {}
    base = 'http://gallium.inria.fr'
    souper = soup_url(base + '/members.html')
    links = souper.select('#columnA_2columns a')
    for link in links:
        p = {'name': text(link), 'url': urljoin(base, link.get('href'))}
        p['icon'] = icon
        p['fuzzy'] = mk_fuzzy(p)
        people[mk_people_key('gallium', p['url'])] = p

    return people


def parse_others():
    """
    Return a dict of manually-added people
    """
    return {}


def parse_all():
    pp = {}
    pp.update(parse_liafa())
    pp.update(parse_pps())
    pp.update(parse_gallium())
    pp.update(parse_others())
    print "All parsing: done"
    print "Adding ids"
    for k in pp:
        pp[k]['id'] = k
    return pp


def save_list():
    """
    Save the list of people, as a JSON hash.
    """
    redis.set('people.json', json.dumps(parse_all()))
