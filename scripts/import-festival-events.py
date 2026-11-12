"""Import the supplied November 2569 event list; coordinates are province-level map anchors."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = root / "docs/reference/loy-krathong-events-2569.txt"
# Longitude / latitude anchors for the existing stylized Thailand map, not venue locations.
groups = [
    ("ภาคเหนือ", {"เชียงใหม่": (98.985,18.788), "ลำปาง":(99.49,18.29), "ตาก":(99.13,16.88), "อุตรดิตถ์":(100.1,17.63), "สุโขทัย":(99.82,17.01), "กำแพงเพชร":(99.52,16.48)}),
    ("ภาคตะวันออกเฉียงเหนือ", {"บึงกาฬ":(103.65,18.36), "อุดรธานี":(102.79,17.41), "หนองคาย":(102.75,17.88), "ขอนแก่น":(102.84,16.44), "อำนาจเจริญ":(104.63,15.86), "ร้อยเอ็ด":(103.65,16.05), "นครราชสีมา":(102.1,14.98)}),
    ("ภาคกลาง", {"อุทัยธานี":(100.02,15.38), "สมุทรสงคราม":(100,13.41), "พระนครศรีอยุธยา":(100.57,14.35), "ชัยนาท":(100.13,15.19), "นนทบุรี":(100.51,13.86), "กรุงเทพมหานคร":(100.5,13.76)}),
    ("ภาคตะวันตก", {"กาญจนบุรี":(99.53,14.02)}),
    ("ภาคตะวันออก", {"ฉะเชิงเทรา":(101.08,13.69)}),
    ("ภาคใต้", {"ชุมพร":(99.18,10.49), "นครศรีธรรมราช":(99.96,8.43), "ระนอง":(98.64,9.96), "ตรัง":(99.61,7.56), "นราธิวาส":(101.82,6.43), "สงขลา":(100.6,7.2)}),
]
metadata = {province:(region,coords) for region,provinces in groups for province,coords in provinces.items()}
text = source.read_text(encoding="utf-8-sig")
events=[]
def add(province,name,date,location,description=""):
    region,coords=metadata.get(province,("ต่างประเทศ" if province=="สหรัฐอเมริกา" else "ยังไม่ระบุจังหวัด",None))
    note=""
    if "23–34" in date:
        if location=="ถนนทรงวาด": date="23–24 พฤศจิกายน 2569"
        else:
            note="ต้นฉบับระบุ 23–34 พฤศจิกายน 2569 อยู่ระหว่างยืนยันวันที่ที่ถูกต้อง"
            date="รอยืนยันกำหนดการ"
    events.append(dict(id=f"festival-2569-{len(events)+1:02d}",province=province,region=region,name=name,date=date,location=location,coordinates=coords,description=description,dateNote=note))

for part in re.split(r"^## ",text,flags=re.M)[1:]:
    heading,_,body=part.partition("\n")
    province=heading.strip()
    if province=="ข้อสรุป" or province=="ข้อความกำกับในไฟล์": continue
    if province=="กรุงเทพมหานคร":
        name=re.search(r"\*\*(.+?)\*\*",body).group(1)
        for venue,date in re.findall(r"^- (.+?) — (.+)$",body,re.M): add(province,name,date.strip(),venue.strip())
        continue
    if province=="งานระดับภูมิภาคที่ไม่ได้ระบุจังหวัด": province="ยังไม่ระบุจังหวัด"
    if province=="งานในต่างประเทศ": province="สหรัฐอเมริกา"
    matches=list(re.finditer(r"^\*\*(.+?)\*\*",body,re.M))
    for index,match in enumerate(matches):
        block=body[match.end():matches[index+1].start() if index+1<len(matches) else len(body)]
        date=re.search(r"^วันที่ (.+)$",block,re.M)
        location=re.search(r"^ณ (.+)$",block,re.M)
        if not date or not location: continue
        extra=[line.strip() for line in block.strip().splitlines() if line.strip() and not line.startswith(("วันที่ ","ณ "))]
        add(province,match.group(1),date.group(1).strip(),location.group(1).strip()," ".join(extra))

out=root / "lib/festival-events.ts"
out.write_text('''export type FestivalEvent = {
  id: string; province: string; region: string; name: string; date: string;
  location: string; coordinates: [number, number] | null; description: string; dateNote: string;
};

// Event copy comes from docs/reference/loy-krathong-events-2569.txt.
// Thanon Song Wat dates were corrected to 23–24 November by the user.
// Coordinates are approximate province map anchors, not precise venue coordinates.
export const festivalEvents: FestivalEvent[] = '''+json.dumps(events,ensure_ascii=False,indent=2)+";\n",encoding="utf-8")
print(f"Imported {len(events)} events, {len(set(e['province'] for e in events if e['coordinates']))} Thai provinces.")
