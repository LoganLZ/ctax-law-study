#!/usr/bin/env python3
"""
Parse textbook_raw.txt and questions.ts to generate chapters.ts
with proper KP data, content, and question mappings.

KP structure:
- Sections contain major headings (一、二、三、...) which are the KPs
- Each major heading has sub-headings （一）（二）... which are content within that KP
- KP ID format: chXX-Y中文 where Y is section number and 中文 is major heading number
- Fallback KP ID: chXX-sY-kp1 when no major heading KPs exist
"""
import re
import sys

# ─── Chapter structure ───
CHAPTERS = [
    {'id':'ch01','number':1,'title':'第一章 行政法基本理论','expectedScore':'3～5分',
     'sections':[{'id':'ch01-s1','number':1,'title':'行政法基础'},{'id':'ch01-s2','number':2,'title':'行政主体'},{'id':'ch01-s3','number':3,'title':'行政行为'}]},
    {'id':'ch02','number':2,'title':'第二章 行政许可法律制度','expectedScore':'1.5～3分',
     'sections':[{'id':'ch02-s1','number':1,'title':'行政许可法基础'},{'id':'ch02-s2','number':2,'title':'行政许可的设定'},{'id':'ch02-s3','number':3,'title':'行政许可的实施'}]},
    {'id':'ch03','number':3,'title':'第三章 行政处罚法律制度','expectedScore':'4～7分',
     'sections':[{'id':'ch03-s1','number':1,'title':'行政处罚法概述'},{'id':'ch03-s2','number':2,'title':'行政处罚的种类和设定'},{'id':'ch03-s3','number':3,'title':'行政处罚实施主体、管辖及适用'},{'id':'ch03-s4','number':4,'title':'行政处罚程序'},{'id':'ch03-s5','number':5,'title':'税务行政处罚'}]},
    {'id':'ch04','number':4,'title':'第四章 行政强制法律制度','expectedScore':'3～5分',
     'sections':[{'id':'ch04-s1','number':1,'title':'行政强制概述'},{'id':'ch04-s2','number':2,'title':'行政强制措施的实施'},{'id':'ch04-s3','number':3,'title':'行政强制执行的实施'}]},
    {'id':'ch05','number':5,'title':'第五章 行政复议法律制度','expectedScore':'3～5分',
     'sections':[{'id':'ch05-s1','number':1,'title':'行政复议基础、范围'},{'id':'ch05-s2','number':2,'title':'行政复议参加人'},{'id':'ch05-s3','number':3,'title':'行政复议机关及行政复议管辖'},{'id':'ch05-s4','number':4,'title':'行政复议程序'}]},
    {'id':'ch06','number':6,'title':'第六章 行政诉讼法律制度','expectedScore':'3～8分',
     'sections':[{'id':'ch06-s1','number':1,'title':'行政诉讼概述'},{'id':'ch06-s2','number':2,'title':'行政诉讼受案范围'},{'id':'ch06-s3','number':3,'title':'行政诉讼管辖'},{'id':'ch06-s4','number':4,'title':'行政诉讼参加人'},{'id':'ch06-s5','number':5,'title':'行政诉讼证据'},{'id':'ch06-s6','number':6,'title':'行政诉讼程序'}]},
    {'id':'ch07','number':7,'title':'第七章 民法总论','expectedScore':'7～15分',
     'sections':[{'id':'ch07-s1','number':1,'title':'民法概述'},{'id':'ch07-s2','number':2,'title':'主体制度'},{'id':'ch07-s3','number':3,'title':'民事权利'},{'id':'ch07-s4','number':4,'title':'民事法律行为和代理'},{'id':'ch07-s5','number':5,'title':'诉讼时效和除斥期间'}]},
    {'id':'ch08','number':8,'title':'第八章 物权法','expectedScore':'13分左右',
     'sections':[{'id':'ch08-s1','number':1,'title':'物权总论'},{'id':'ch08-s2','number':2,'title':'所有权'},{'id':'ch08-s3','number':3,'title':'用益物权'},{'id':'ch08-s4','number':4,'title':'担保物权'},{'id':'ch08-s5','number':5,'title':'占有'}]},
    {'id':'ch09','number':9,'title':'第九章 债法','expectedScore':'20分左右',
     'sections':[{'id':'ch09-s1','number':1,'title':'债法总论'},{'id':'ch09-s2','number':2,'title':'合同法'},{'id':'ch09-s3','number':3,'title':'侵权责任法'}]},
    {'id':'ch10','number':10,'title':'第十章 婚姻家庭与继承法','expectedScore':'3～10分',
     'sections':[{'id':'ch10-s1','number':1,'title':'婚姻家庭法'},{'id':'ch10-s2','number':2,'title':'继承法'}]},
    {'id':'ch11','number':11,'title':'第十一章 个人独资企业法','expectedScore':'1.5～3分',
     'sections':[{'id':'ch11-s1','number':1,'title':'个人独资企业法基础'},{'id':'ch11-s2','number':2,'title':'个人独资企业的设立、变更和终止'}]},
    {'id':'ch12','number':12,'title':'第十二章 合伙企业法','expectedScore':'3～13分',
     'sections':[{'id':'ch12-s1','number':1,'title':'合伙企业法基础'},{'id':'ch12-s2','number':2,'title':'普通合伙企业'},{'id':'ch12-s3','number':3,'title':'有限合伙企业'},{'id':'ch12-s4','number':4,'title':'合伙企业解散、清算'}]},
    {'id':'ch13','number':13,'title':'第十三章 公司法','expectedScore':'5～12分',
     'sections':[{'id':'ch13-s1','number':1,'title':'公司设立'},{'id':'ch13-s2','number':2,'title':'股东出资与股东资格'},{'id':'ch13-s3','number':3,'title':'公司组织机构'},{'id':'ch13-s4','number':4,'title':'股东权利与股东诉讼'},{'id':'ch13-s5','number':5,'title':'股权（股份）转让与股份回购、质押'},{'id':'ch13-s6','number':6,'title':'公司财务会计'},{'id':'ch13-s7','number':7,'title':'公司变更、解散与清算'},{'id':'ch13-s8','number':8,'title':'公司登记'}]},
    {'id':'ch14','number':14,'title':'第十四章 破产法','expectedScore':'5～12分',
     'sections':[{'id':'ch14-s1','number':1,'title':'破产法基础'},{'id':'ch14-s2','number':2,'title':'破产申请'},{'id':'ch14-s3','number':3,'title':'破产管理人'},{'id':'ch14-s4','number':4,'title':'破产债权'},{'id':'ch14-s5','number':5,'title':'债权人会议与债权人委员会'},{'id':'ch14-s6','number':6,'title':'债务人财产'},{'id':'ch14-s7','number':7,'title':'重整与和解'},{'id':'ch14-s8','number':8,'title':'破产清算'}]},
    {'id':'ch15','number':15,'title':'第十五章 电子商务法','expectedScore':'1～5分',
     'sections':[{'id':'ch15-s1','number':1,'title':'电子商务法基础'},{'id':'ch15-s2','number':2,'title':'电子商务经营主体'},{'id':'ch15-s3','number':3,'title':'电子商务合同'},{'id':'ch15-s4','number':4,'title':'电子签名和电子认证'},{'id':'ch15-s5','number':5,'title':'电子支付'},{'id':'ch15-s6','number':6,'title':'电子商务税收法律'}]},
    {'id':'ch16','number':16,'title':'第十六章 社会保险法','expectedScore':'0～2分',
     'sections':[{'id':'ch16-s1','number':1,'title':'社会保险法基本理论'},{'id':'ch16-s2','number':2,'title':'基本养老保险'},{'id':'ch16-s3','number':3,'title':'医疗保险'},{'id':'ch16-s4','number':4,'title':'工伤保险'},{'id':'ch16-s5','number':5,'title':'失业保险'}]},
    {'id':'ch17','number':17,'title':'第十七章 民事诉讼法','expectedScore':'1.5～5.5分',
     'sections':[{'id':'ch17-s1','number':1,'title':'民事诉讼法基础'},{'id':'ch17-s2','number':2,'title':'民事诉讼受案范围和管辖'},{'id':'ch17-s3','number':3,'title':'民事诉讼参加人'},{'id':'ch17-s4','number':4,'title':'民事诉讼证据和证明'},{'id':'ch17-s5','number':5,'title':'民事诉讼程序'}]},
    {'id':'ch18','number':18,'title':'第十八章 刑法','expectedScore':'9～20分',
     'sections':[{'id':'ch18-s1','number':1,'title':'刑法基础'},{'id':'ch18-s2','number':2,'title':'犯罪构成'},{'id':'ch18-s3','number':3,'title':'刑罚种类'},{'id':'ch18-s4','number':4,'title':'刑罚适用'},{'id':'ch18-s5','number':5,'title':'涉税犯罪'},{'id':'ch18-s6','number':6,'title':'涉税职务犯罪'}]},
    {'id':'ch19','number':19,'title':'第十九章 刑事诉讼法','expectedScore':'3～5分',
     'sections':[{'id':'ch19-s1','number':1,'title':'刑事诉讼法基础'},{'id':'ch19-s2','number':2,'title':'刑事诉讼制度'},{'id':'ch19-s3','number':3,'title':'强制措施'},{'id':'ch19-s4','number':4,'title':'刑事诉讼程序'}]},
]

CN_NUMS = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,
            '十一':11,'十二':12,'十三':13,'十四':14,'十五':15,'十六':16,'十七':17,'十八':18,'十九':19,'二十':20}

# ─── Read textbook ───
TEXTBOOK_PATH = '/Users/ninbot/Desktop/个人文件/CTA/2025/textbook_raw.txt'
with open(TEXTBOOK_PATH, 'r', encoding='utf-8') as f:
    textbook_lines = f.readlines()

# ─── Read questions.ts ───
QUESTIONS_PATH = '/Users/ninbot/Desktop/Cherry Studio目录/小刘的杂活助手/ctax-law-study/src/data/questions.ts'
with open(QUESTIONS_PATH, 'r', encoding='utf-8') as f:
    q_content = f.read()

kp_to_questions = {}
for m in re.finditer(r'id:\s*"([^"]+)"[^}]*?relatedKpId:\s*"([^"]+)"', q_content):
    qid, kpId = m.group(1), m.group(2)
    if kpId not in kp_to_questions:
        kp_to_questions[kpId] = []
    kp_to_questions[kpId].append(qid)

print(f"Found {len(kp_to_questions)} unique KP IDs in questions.ts")
print(f"KP ID formats used:")
cn_format = set()
fallback_format = set()
for kpId in kp_to_questions:
    if re.match(r'ch\d+-s\d+-kp\d+', kpId):
        fallback_format.add(kpId)
    else:
        cn_format.add(kpId)
print(f"  chXX-Y中文 format: {len(cn_format)} IDs")
print(f"  chXX-sY-kp1 format: {len(fallback_format)} IDs")

# ─── Find content section boundaries (not TOC) ───
# Content sections: lines where "第X节 标题" appears without trailing page number
# These were found at specific line indices earlier

section_pattern = re.compile(r'^第([一二三四五六七八九十]+)节\s+(.+)$')
# Content section: no trailing digits (page numbers)
content_section_pattern = re.compile(r'^第([一二三四五六七八九十]+)节\s+([^\d]+)\s*$')

# Find chapter boundaries in content
chapter_content_pattern = re.compile(r'^第([一二三四五六七八九十]+)章\s*$')

# Build a list of (chapter_number, section_number, section_title, line_idx) for content sections
# Strategy: track current chapter, find content section headers

# First, find the "考点精讲" markers which precede the first section in each chapter
# This helps us know when actual content starts

# Let me build content section list manually based on the grep results I found
content_sections = [
    # ch01
    (1, 1, '行政法基础', 202),
    (1, 2, '行政主体', 369),
    (1, 3, '行政行为', 552),
    # ch02
    (2, 1, '行政许可法基础', 960),
    (2, 2, '行政许可的设定', 1093),
    (2, 3, '行政许可的实施', 1221),
    # ch03
    (3, 1, '行政处罚法概述', 1554),
    (3, 2, '行政处罚的种类和设定', 1590),
    (3, 3, '行政处罚实施主体、管辖及适用', 1666),
    (3, 4, '行政处罚程序', 1813),
    (3, 5, '税务行政处罚', 2091),
    # ch04
    (4, 1, '行政强制概述', 2282),
    (4, 2, '行政强制措施的实施', 2411),
    (4, 3, '行政强制执行的实施', 2614),
    # ch05
    (5, 1, '行政复议基础、范围', 2878),
    (5, 2, '行政复议参加人', 3120),
    (5, 3, '行政复议机关及行政复议管辖', 3253),
    (5, 4, '行政复议程序', 3331),
    # ch06
    (6, 1, '行政诉讼概述', 3692),
    (6, 2, '行政诉讼受案范围', 3746),
    (6, 3, '行政诉讼管辖', 3801),
    (6, 4, '行政诉讼参加人', 3850),
    (6, 5, '行政诉讼证据', 4055),
    (6, 6, '行政诉讼程序', 4234),
    # ch07
    (7, 1, '民法概述', 4778),
    (7, 2, '主体制度', 4884),
    (7, 3, '民事权利', 5112),
    (7, 4, '民事法律行为和代理', 5238),
    (7, 5, '诉讼时效和除斥期间', 5693),
    # ch08
    (8, 1, '物权总论', 5857),
    (8, 2, '所有权', 6128),
    (8, 3, '用益物权', 6418),
    (8, 4, '担保物权', 6628),
    (8, 5, '占有', 7179),
    # ch09
    (9, 1, '债法总论', 7298),
    (9, 2, '合同法', 8487),
    (9, 3, '侵权责任法', 9790),
    # ch10
    (10, 1, '婚姻家庭法', 10430),
    (10, 2, '继承法', 10865),
    # ch11
    (11, 1, '个人独资企业法基础', 11280),
    (11, 2, '个人独资企业的设立、变更和终止', 11321),
    # ch12
    (12, 1, '合伙企业法基础', 11455),
    (12, 2, '普通合伙企业', 11486),
    (12, 3, '有限合伙企业', 11876),
    (12, 4, '合伙企业解散、清算', 12007),
    # ch13
    (13, 1, '公司设立', 12157),
    (13, 2, '股东出资与股东资格', 12451),
    (13, 3, '公司组织机构', 12532),
    (13, 4, '股东权利与股东诉讼', 13141),
    (13, 5, '股权（股份）转让与股份回购、质押', 13328),
    (13, 6, '公司财务会计', 13451),
    (13, 7, '公司变更、解散与清算', 13513),
    (13, 8, '公司登记', 13658),
    # ch14
    (14, 1, '破产法基础', 13714),
    (14, 2, '破产申请', 13770),
    (14, 3, '破产管理人', 13924),
    (14, 4, '破产债权', 14033),
    (14, 5, '债权人会议与债权人委员会', 14073),
    (14, 6, '债务人财产', 14217),
    (14, 7, '重整与和解', 14420),
    (14, 8, '破产清算', 14647),
    # ch15
    (15, 1, '电子商务法基础', 14761),
    (15, 2, '电子商务经营主体', 14783),
    (15, 3, '电子商务合同', 14934),
    (15, 4, '电子签名和电子认证', 15025),
    (15, 5, '电子支付', 15098),
    (15, 6, '电子商务税收法律', 15212),
    # ch16
    (16, 1, '社会保险法基本理论', 15244),
    (16, 2, '基本养老保险', 15350),
    (16, 3, '医疗保险', 15372),
    (16, 4, '工伤保险', 15393),
    (16, 5, '失业保险', 15426),
    # ch17
    (17, 1, '民事诉讼法基础', 15474),
    (17, 2, '民事诉讼受案范围和管辖', 15524),
    (17, 3, '民事诉讼参加人', 15670),
    (17, 4, '民事诉讼证据和证明', 15850),
    (17, 5, '民事诉讼程序', 15958),
    # ch18
    (18, 1, '刑法基础', 16145),
    (18, 2, '犯罪构成', 16211),
    (18, 3, '刑罚种类', 16363),
    (18, 4, '刑罚适用', 16502),
    (18, 5, '涉税犯罪', 16994),
    (18, 6, '涉税职务犯罪', 17609),
    # ch19
    (19, 1, '刑事诉讼法基础', 17826),
    (19, 2, '刑事诉讼制度', 18014),
    (19, 3, '强制措施', 18387),
    (19, 4, '刑事诉讼程序', 18511),
]

# ─── Parse KP headings ───
# Major heading: "一、行政法概述" -> KP
# Sub-heading: "（一）行政法的概念" -> part of that KP's content
# Star markers: （★）= high importance

# Pattern for major topic headings
major_heading_re = re.compile(r'^([一二三四五六七八九十]+)、(.+?)(?:（[★]+）)?\s*$')
# Pattern for sub-KP headings (（一）(title)(★))
sub_heading_re = re.compile(r'^（([一二三四五六七八九十]+）)(.+?)(?:（[★]+）)?\s*$')
# Pattern for star markers
star_marker_re = re.compile(r'（[★]+）')

# ─── Clean content functions ───

def clean_ocr_duplicates(text):
    """Remove OCR duplicate characters: 授授予予 → 授予, 11.. → 1."""
    # Simple regex: (.)\1 → \1 removes consecutive identical characters
    # This handles 授授→授, 予予→予, ..→., 11→1, etc.
    # Run it repeatedly until no more changes (for patterns like 11.. → 1. → 1 after two passes)
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r'(.)\1', r'\1', text)
    return text

def clean_content(text):
    """Clean extracted content per requirements."""
    # Remove page markers
    text = re.sub(r'===PAGE\d+===', '', text)
    text = re.sub(r'==PAGE\d+==', '', text)
    # Remove page numbers · N ·
    text = re.sub(r'·\s*\d+\s*·', '', text)
    # Remove standalone · at line start/end
    text = re.sub(r'^\s*·\s*$', '', text, flags=re.MULTILINE)
    # Remove book headers
    text = re.sub(r'打好基础\s*涉税服务相关法律', '', text)
    # Remove chapter|title headers
    text = re.sub(r'第[一二三四五六七八九十]+章[|].+', '', text)
    # Remove standalone chapter headers
    text = re.sub(r'^第[一二三四五六七八九十]+章\s*$', '', text, flags=re.MULTILINE)
    # Remove standalone section titles
    text = re.sub(r'^第[一二三四五六七八九十]+节\s+.+$', '', text, flags=re.MULTILINE)
    # Remove study progress text
    text = re.sub(r'至此.*?加油呀！', '', text)
    text = re.sub(r'斯考卡片\s*扫码全知道\s*\d+%', '', text)
    text = re.sub(r'斯考卡片\s*扫码全知道', '', text)
    # Remove "考点精讲"
    text = re.sub(r'^考点精讲$', '', text, flags=re.MULTILINE)
    # Remove "学习提要" and surrounding text until next section
    # Remove meta sections: 学习提要, 重要程度, 平均分值, 考核题型, 本章提示
    text = re.sub(r'学习提要.*?(?:考核题型|本章提示).*?(?:·\s*\d+\s*·|===PAGE)', '', text, flags=re.DOTALL)
    # Remove "解题高手" blocks
    text = re.sub(r'解题高手\s*命题角度.*?(?:（[一二三四五六七八九十]+）|===PAGE\d+===)', '', text, flags=re.DOTALL)
    # Remove "原理详解" blocks
    text = re.sub(r'原理详解.*?(?:===PAGE\d+===|（[一二三四五六七八九十]+）)', '', text, flags=re.DOTALL)
    # Remove "精准答疑" blocks
    text = re.sub(r'精准答疑.*?(?:\|典例|===PAGE\d+===)', '', text, flags=re.DOTALL)
    # Remove "典例研习" blocks (multiple patterns)
    text = re.sub(r'\|?\s*典例研习.*?本题答案\s*[A-D]+\s*', '', text, flags=re.DOTALL)
    # Remove "斯尔解析" blocks
    text = re.sub(r'斯尔解析.*?本题答案\s*[A-D]+\s*', '', text, flags=re.DOTALL)
    # Remove "陷阱提示" lines
    text = re.sub(r'陷阱提示[^（]*', '', text, flags=re.DOTALL)
    # Remove "提示：" standalone lines
    text = re.sub(r'^提示：.*$', '', text, flags=re.MULTILINE)
    # Remove table header rows
    text = re.sub(r'^分类\s+.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^形式\s+.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^类型\s+.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^项目\s+.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^续表$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^是否具有.*$', '', text, flags=re.MULTILINE)
    # Remove OCR duplicate chars
    text = clean_ocr_duplicates(text)
    # Remove standalone 变 (OCR artifact from textbooks)
    text = re.sub(r'\s+变\s*', ' ', text)
    text = re.sub(r'^变$', '', text, flags=re.MULTILINE)
    # Collapse whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    lines = text.split('\n')
    lines = [l.strip() for l in lines]
    text = '\n'.join(lines)
    text = text.strip()
    # Remove consecutive empty lines
    while '\n\n\n' in text:
        text = text.replace('\n\n\n', '\n\n')
    return text

# ─── Extract KPs for each section ───

def find_section_end(sec_idx, ch_num, sec_num):
    """Find the end line index for a section."""
    # Find the next section in the content_sections list
    for j, (c, s, t, idx) in enumerate(content_sections):
        if c == ch_num and s == sec_num:
            # Next section
            if j + 1 < len(content_sections):
                return content_sections[j + 1][3]
            else:
                return len(textbook_lines)
    return len(textbook_lines)

def extract_kps_for_section(ch_num, sec_num, start_idx, end_idx):
    """Extract all major topic headings (KPs) and their content from a section."""
    kps = []
    major_headings = []  # (cn_num_str, title, importance, line_idx)

    for i in range(start_idx, end_idx):
        line = textbook_lines[i].strip()

        # Check for major heading: 一、title or 一、title（★）
        m = major_heading_re.match(line)
        if m:
            cn_num_str = m.group(1)
            title_raw = m.group(2).strip()
            # Remove star marker from title
            title = re.sub(r'（[★]+）', '', title_raw).strip()
            # Remove OCR artifacts: standalone 变 at end of titles
            title = re.sub(r'\s+变$', '', title)
            title = title.strip()
            # Check importance from the line itself
            importance = 'high' if star_marker_re.search(line) else 'normal'
            major_headings.append((cn_num_str, title, importance, i))

    # If no major headings found, treat entire section as one KP
    if len(major_headings) == 0:
        # Use the section content as a single KP
        section_title = None
        for c, s, t, idx in content_sections:
            if c == ch_num and s == sec_num:
                section_title = t
                break
        if section_title is None:
            section_title = f'Section {sec_num}'

        raw_content = ''.join(textbook_lines[start_idx:end_idx])
        cleaned = clean_content(raw_content)

        # Check if any sub-heading has star markers for importance
        importance = 'normal'
        for i in range(start_idx, end_idx):
            line = textbook_lines[i].strip()
            if star_marker_re.search(line):
                importance = 'high'
                break

        kp_id = f'{ch_id_from_num(ch_num)}-s{sec_num}-kp1'
        section_id = f'{ch_id_from_num(ch_num)}-s{sec_num}'

        kps.append({
            'id': kp_id,
            'sectionId': section_id,
            'title': section_title,
            'content': cleaned,
            'importance': importance,
        })
        return kps

    # Build KP content for each major heading
    for j, (cn_num_str, title, importance, heading_idx) in enumerate(major_headings):
        # Content starts after the heading line
        content_start = heading_idx + 1

        # Content ends at the next major heading or section end
        if j + 1 < len(major_headings):
            content_end = major_headings[j + 1][3]
        else:
            content_end = end_idx

        raw_content = ''.join(textbook_lines[content_start:content_end])
        cleaned = clean_content(raw_content)

        # Build KP ID: chXX-Y中文
        ch_str = ch_id_from_num(ch_num)
        kp_id = f'{ch_str}-{sec_num}{cn_num_str}'
        section_id = f'{ch_str}-s{sec_num}'

        kps.append({
            'id': kp_id,
            'sectionId': section_id,
            'title': title,
            'content': cleaned,
            'importance': importance,
        })

    return kps

def ch_id_from_num(num):
    return f'ch{num:02d}'

# ─── Build all KPs ───
all_chapter_kps = {}

for ch in CHAPTERS:
    ch_num = ch['number']
    ch_id = ch['id']
    chapter_kps = []

    for sec in ch['sections']:
        sec_num = sec['number']

        # Find section start
        sec_start = None
        for c, s, t, idx in content_sections:
            if c == ch_num and s == sec_num:
                sec_start = idx
                break

        if sec_start is None:
            print(f"WARNING: Could not find content section for ch{ch_num}-s{sec_num}")
            continue

        sec_end = find_section_end(0, ch_num, sec_num)
        kps = extract_kps_for_section(ch_num, sec_num, sec_start, sec_end)
        chapter_kps.extend(kps)

    all_chapter_kps[ch_id] = chapter_kps

# ─── Add question mappings ───
for ch_id, kps in all_chapter_kps.items():
    for kp in kps:
        kp_id = kp['id']
        if kp_id in kp_to_questions:
            kp['relatedQuestionIds'] = kp_to_questions[kp_id]
        else:
            kp['relatedQuestionIds'] = []

# Handle fallback KP ID mapping: chXX-sY-kp1 -> first KP in section
for ch in CHAPTERS:
    ch_id = ch['id']
    for sec in ch['sections']:
        sec_num = sec['number']
        fallback_id = f'{ch_id}-s{sec_num}-kp1'
        section_id = f'{ch_id}-s{sec_num}'

        section_kps = [kp for kp in all_chapter_kps[ch_id] if kp['sectionId'] == section_id]

        if fallback_id in kp_to_questions and len(section_kps) > 0:
            first_kp = section_kps[0]
            existing = set(first_kp['relatedQuestionIds'])
            for qid in kp_to_questions[fallback_id]:
                if qid not in existing:
                    first_kp['relatedQuestionIds'].append(qid)

# ─── Generate TypeScript ───

def escape_ts_string(s):
    """Escape string for TypeScript single-quoted string literal, ensuring it stays on one line."""
    # Order matters: backslash first, then newline, then single quote
    s = s.replace('\\', '\\\\')
    s = s.replace('\n', '\\n')
    s = s.replace('\r', '\\r')
    s = s.replace("'", "\\'")
    return s

def truncate_content(s, max_len=4000):
    if len(s) > max_len:
        return s[:max_len] + '（内容过长，已截断）'
    return s

output_lines = []
output_lines.append("import type { Chapter } from '../types';")
output_lines.append("")
output_lines.append("export const chaptersData: Chapter[] = [")

for ch in CHAPTERS:
    ch_id = ch['id']
    ch_num = ch['number']
    output_lines.append("  {")
    output_lines.append(f"    id: '{ch_id}',")
    output_lines.append(f"    number: {ch_num},")
    output_lines.append(f"    title: '{escape_ts_string(ch['title'])}',")
    output_lines.append(f"    expectedScore: '{escape_ts_string(ch['expectedScore'])}',")
    output_lines.append("    sections: [")
    for sec in ch['sections']:
        output_lines.append(f"      {{ id: '{sec['id']}', number: {sec['number']}, title: '{escape_ts_string(sec['title'])}' }},")
    output_lines.append("    ],")

    kps = all_chapter_kps.get(ch_id, [])
    output_lines.append("    knowledgePoints: [")
    for kp in kps:
        escaped_content = escape_ts_string(truncate_content(kp['content']))
        escaped_title = escape_ts_string(kp['title'])
        q_ids = ', '.join([f"'{qid}'" for qid in kp['relatedQuestionIds']])
        output_lines.append(f"      {{ id: '{kp['id']}', sectionId: '{kp['sectionId']}', title: '{escaped_title}', content: '{escaped_content}', importance: '{kp['importance']}', relatedQuestionIds: [{q_ids}] }},")
    output_lines.append("    ],")
    output_lines.append("  },")

output_lines.append("];")

output_text = '\n'.join(output_lines)

OUTPUT_PATH = '/Users/ninbot/Desktop/Cherry Studio目录/小刘的杂活助手/ctax-law-study/src/data/chapters.ts'
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    f.write(output_text)

# ─── Stats ───
total_kps = sum(len(kps) for kps in all_chapter_kps.values())
print(f"\nGenerated chapters.ts with {total_kps} KPs across {len(CHAPTERS)} chapters")
for ch_id, kps in all_chapter_kps.items():
    print(f"  {ch_id}: {len(kps)} KPs")
    for kp in kps[:3]:  # Show first 3 per chapter
        preview = kp['content'][:80] + '...' if len(kp['content']) > 80 else kp['content']
        print(f"    {kp['id']}: {kp['title']} ({kp['importance']}) Q:{kp['relatedQuestionIds']}")

# ─── Verify: check for real newlines in content strings ───
error_count = 0
for line in output_lines:
    if 'content:' in line:
        # The content string must be between content: ' and ', importance:
        # Check that the line doesn't contain a real newline character
        if '\n' in line and line.count('\n') > 0:
            # But output_lines items are single strings, they shouldn't have real newlines
            # Actually, each output_line is a single line, so real newline means error
            pass

# Better check: verify the output file has proper structure
with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
    file_content = f.read()
    file_lines = file_content.split('\n')

# Check each line that has content: to ensure it's properly closed
for i, fl in enumerate(file_lines):
    if 'content:' in fl and not fl.strip().endswith("'},"):
        # Check if it might still be valid
        if "content: '" in fl:
            # Find the opening quote
            content_start = fl.index("content: '") + len("content: '")
            # The content should end with "', importance:"
            if "', importance:" not in fl[content_start:]:
                print(f"LINE {i+1}: Content string may not be properly closed!")
                print(f"  {fl[:200]}")
                error_count += 1

# Also check for unescaped single quotes
# Look for patterns like content: '...it's...' which would break
for i, fl in enumerate(file_lines):
    if 'content:' in fl:
        # Find content string boundaries
        start_idx = fl.index("content: '") + len("content: '")
        end_search = "', importance:"
        end_idx = fl.index(end_search, start_idx)
        content_str = fl[start_idx:end_idx]
        # Check for unescaped apostrophes
        # A proper escape is \\'
        # An unescaped one is just ' not preceded by \\
        last_pos = 0
        while True:
            apos_idx = content_str.find("'", last_pos)
            if apos_idx == -1:
                break
            if apos_idx == 0 or content_str[apos_idx-1] != '\\':
                print(f"LINE {i+1}: Possible unescaped single quote at position {apos_idx}")
                print(f"  Context: ...{content_str[max(0,apos_idx-10):apos_idx+10]}...")
                error_count += 1
            last_pos = apos_idx + 1

if error_count == 0:
    print("\nVerification: No errors found in content strings!")
else:
    print(f"\nVerification: Found {error_count} potential issues!")

print("\nDone! Written to:", OUTPUT_PATH)