// Translate presentation text without rebuilding controls or interrupting a match.
const thai = {
  'Open your chamber to rivals or invite a friend.':'เปิดห้องรับคู่ประลอง หรือเชิญเพื่อนของคุณ','Join by Code':'เข้าร่วมด้วยรหัส','A friend\'s invitation opens the gate.':'ใช้รหัสเชิญจากเพื่อนเพื่อเข้าร่วม','Find Public Rooms':'ค้นหาห้องสาธารณะ','Your next rival awaits.':'คู่ประลองคนต่อไปกำลังรอคุณ','Refresh rooms':'รีเฟรชรายชื่อห้อง','No rooms yet':'ยังไม่มีห้องเปิดอยู่','Create a room and invite your first rival.':'สร้างห้องแล้วเชิญคู่ประลองคนแรกของคุณ','Unable to load rooms. Try refreshing.':'โหลดรายชื่อห้องไม่ได้ กรุณารีเฟรช','Makruk':'หมากรุกไทย','Thai chess · 2 players':'หมากรุกไทย · ผู้เล่น 2 คน',
  'Create Room':'สร้างห้อง','Join Room':'เข้าร่วมห้อง','Public':'สาธารณะ','Private':'ส่วนตัว','Room name':'ชื่อห้อง','Room visibility':'การเข้าถึงห้อง','Open to all rivals':'ทุกคนเข้าร่วมได้','Invite with a code':'เชิญด้วยรหัสห้อง','Generate another room name':'สุ่มชื่อห้องใหม่','Choose your rival. Write your legend.':'เลือกคู่ประลอง สร้างตำนานของคุณ','Give your room a name.':'กรุณาตั้งชื่อห้อง',
  'Settings':'ตั้งค่า','Start Game':'เริ่มเกม','Create Character':'สร้างตัวละคร','YOUR LEGEND':'ตำนานของคุณ','Multiplayer':'ผู้เล่นหลายคน','ONLINE':'ออนไลน์',
  'SHAPE YOUR SANCTUARY':'ปรับแต่งวิหารของคุณ','Battle sounds':'เสียงการต่อสู้','Cinematic menu motion':'ภาพเคลื่อนไหวในเมนู','Return':'กลับ',
  'Sound accompanies moves and captures. Your preferences are saved on this device.':'เล่นเสียงเมื่อเดินและกินหมาก การตั้งค่าจะบันทึกไว้ในอุปกรณ์นี้',
  'A GAME OF KINGS':'ศึกแห่งราชัน','THE SANCTUARY · I':'วิหาร · I','AN ANCIENT RIVALRY. REAWAKENED.':'ศึกโบราณที่หวนคืน','THE MAKRUK CHRONICLES':'ตำนานหมากรุกไทย','Kingdoms fall. The fire remembers.':'อาณาจักรล่มสลาย แต่เปลวไฟยังจดจำ',
  'CHOOSE YOUR OPPONENT':'เลือกคู่ต่อสู้','Solo':'เล่นคนเดียว','VS BOT':'พบคอมพิวเตอร์','Local 2 Player':'เล่นสองคน','SHARED DEVICE':'อุปกรณ์เดียวกัน','← Back':'← กลับ','Back':'กลับ','STRATEGY, CARVED IN STONE':'กลยุทธ์ที่จารึกบนศิลา',
  'Main menu':'เมนูหลัก','MENU':'เมนู','A moment of stillness':'พักศึกชั่วคราว','The kingdoms await your return.':'อาณาจักรกำลังรอคุณกลับมา','Resume game':'เล่นต่อ','The match':'การประลอง','The sanctuary':'วิหาร',
  'IVORY CAPTURES':'หมากที่ฝ่ายขาวกิน','OBSIDIAN CAPTURES':'หมากที่ฝ่ายดำกิน','ESC TO RESUME':'กด ESC เพื่อเล่นต่อ','Reset view':'คืนมุมมอง','Fullscreen':'เต็มหน้าจอ','New game':'เกมใหม่','Undo':'ย้อนตาเดิน','How to play':'วิธีเล่น',
  'Orbit':'มุมมองรอบกระดาน','Free fly':'สำรวจอิสระ','Obsidian dynasty':'ราชวงศ์ดำ','Ivory kingdom':'อาณาจักรขาว','The Ember King':'ราชันเพลิง','Black pieces':'หมากดำ','White pieces':'หมากขาว','WAITING':'กำลังรอ','YOUR TURN':'ตาของคุณ','FINISHED':'จบเกม','BOT TURN':'ตาคอมพิวเตอร์',
  'IVORY TO MOVE':'ตาฝ่ายขาว','OBSIDIAN TO MOVE':'ตาฝ่ายดำ','IVORY WINS':'ฝ่ายขาวชนะ','OBSIDIAN WINS':'ฝ่ายดำชนะ','MATCH DRAWN':'เสมอ','No pieces captured':'ยังไม่มีหมากที่ถูกกิน','Move chronicle':'บันทึกการเดิน',
  'The board awaits':'กระดานกำลังรอ','Select a piece to see its legal moves.':'เลือกหมากเพื่อดูช่องที่เดินได้','Let your story unfold.':'เริ่มเขียนตำนานของคุณ','The next chapter is yours.':'ตาถัดไปเป็นของคุณ','Check. Protect your Khun.':'รุก! ปกป้องขุนของคุณ','Every legend begins':'ทุกตำนานเริ่มต้น','with a single move.':'จากการเดินครั้งแรก',
  'Start honor count':'เริ่มนับศักดิ์','Stop honor count':'หยุดนับศักดิ์','Accept counting draw':'ยอมรับผลเสมอ','A NEW CHAPTER':'บทใหม่ของตำนาน','Begin again?':'เริ่มใหม่หรือไม่?','This will clear the current match and its move chronicle.':'เกมปัจจุบันและบันทึกการเดินจะถูกล้าง','Begin new game':'เริ่มเกมใหม่','Keep playing':'เล่นต่อ',
  'THE SANCTUARY · ONLINE':'วิหาร · ออนไลน์','Gather your rivals':'รวมพลคู่ประลอง','Return to sanctuary':'กลับสู่วิหาร','Calling the sanctuary…':'กำลังเชื่อมต่อวิหาร…','Forge your legend':'สร้างตำนานของคุณ','Your name in the chronicles':'ชื่อของคุณในตำนาน','Name your champion':'ตั้งชื่อผู้กล้า','Bind your character':'บันทึกตัวละคร',
  'Create public room':'สร้างห้องสาธารณะ','Create private room':'สร้างห้องส่วนตัว','Join Room · Browse rivals':'เข้าร่วมห้อง · ค้นหาคู่ประลอง','Private room code':'รหัสห้องส่วนตัว','Enter with code':'เข้าร่วมด้วยรหัส','Select / edit character':'เลือก / แก้ไขตัวละคร','Rejoin your last room':'กลับเข้าห้องล่าสุด','Rivals await':'คู่ประลองกำลังรอ',
  'No open chambers. Create a room and invite a rival.':'ยังไม่มีห้องว่าง สร้างห้องแล้วเชิญคู่ประลองได้เลย','Create a public room':'สร้างห้องสาธารณะ','The waiting chamber':'ห้องเตรียมประลอง','An empty throne awaits your rival…':'บัลลังก์ว่างกำลังรอคู่ประลองของคุณ…','Hide room code':'ซ่อนรหัสห้อง','Show room code':'แสดงรหัสห้อง','Copy invitation code':'คัดลอกรหัสเชิญ','Stand down':'ยกเลิกความพร้อม','I am ready':'พร้อมแล้ว','Begin the match':'เริ่มประลอง','Leave room':'ออกจากห้อง',
  'Connection lost. Reconnecting…':'การเชื่อมต่อขาดหาย กำลังเชื่อมต่อใหม่…','Reconnecting to the sanctuary…':'กำลังเชื่อมต่อวิหารใหม่…','The host closed this room, or it expired.':'เจ้าของปิดห้องแล้ว หรือห้องหมดอายุ','Give your champion a name.':'กรุณาตั้งชื่อผู้กล้า','crown':'มงกุฎ','flame':'เปลวไฟ','moon':'จันทรา',
  'LOCAL TWO-PLAYER':'ผู้เล่นสองคนในเครื่อง','SOLO / VS THE EMBER KING':'เล่นคนเดียว / พบราชันเพลิง','ONLINE / IVORY':'ออนไลน์ / ฝ่ายขาว','ONLINE / OBSIDIAN':'ออนไลน์ / ฝ่ายดำ','The Ember King is thinking...':'ราชันเพลิงกำลังคิด...','Sound muted':'ปิดเสียงแล้ว','Sound enabled':'เปิดเสียงแล้ว','A new legend begins.':'ตำนานบทใหม่เริ่มต้นแล้ว','Last turn undone.':'ย้อนตาเดินล่าสุดแล้ว',
  'Enable sound':'เปิดเสียง','Mute sound':'ปิดเสียง','Toggle sound':'เปิด / ปิดเสียง','Reset camera':'คืนมุมกล้อง','Toggle fullscreen':'เปิด / ปิดเต็มหน้าจอ','Pause game':'พักเกม','Match status':'สถานะการประลอง','Main menu':'เมนูหลัก','Interactive 3D Makruk board':'กระดานหมากรุกไทยสามมิติ','Close guide':'ปิดวิธีเล่น','Match controls':'ควบคุมการประลอง','Move chronicle':'บันทึกการเดิน','Choose an emblem':'เลือกตราประจำตัว',
  'THE ART OF THAI CHESS':'ศาสตร์แห่งหมากรุกไทย','Know your kingdom.':'รู้จักอาณาจักรของคุณ','Promotion.':'การหงายเบี้ย','Draws.':'การเสมอ','Explore.':'การสำรวจ',
  'One square in any direction. No castling.':'เดินหนึ่งช่องได้ทุกทิศทาง ไม่มีการเข้าป้อม','One square diagonally.':'เดินทแยงหนึ่งช่อง','One square diagonally, or one square forward.':'เดินทแยงหนึ่งช่อง หรือเดินตรงไปข้างหน้าหนึ่งช่อง','An L-shaped leap: two squares, then one across.':'กระโดดเป็นรูปตัวแอล สองช่องแล้วเลี้ยวหนึ่งช่อง','Any distance horizontally or vertically.':'เดินตรงในแนวนอนหรือแนวตั้งได้ไม่จำกัดช่อง','One step forward; capture diagonally forward. No double step.':'เดินหน้าหนึ่งช่อง กินทแยงไปข้างหน้า ไม่มีการเดินสองช่อง',
};
let language='th';
try{const saved=localStorage.getItem('crown-language');if(saved==='en'||saved==='th')language=saved;}catch{}
export const getLanguage=()=>language;
export function translate(text){
  if(language==='en')return text;
  const trimmed=text.trim();let value=thai[trimmed];
  if(value===undefined){
    value=trimmed.replace(/^(\d+) MOVES$/,'$1 ตาเดิน').replace(/^(\d+) legal moves? · choose a marked square\.$/,'เดินได้ $1 ช่อง · เลือกช่องที่ทำเครื่องหมาย');
    value=value.replace(/^(♛|♜|☾) (crown|flame|moon)$/,(_,icon,key)=>`${icon} ${thai[key]}`);
  }
  return text.replace(trimmed,value);
}
export function mountLanguage(){
  const settings=document.querySelector('#settings-dialog');
  settings.querySelector('h2').insertAdjacentHTML('afterend','<div class="setting-row language-setting"><span id="language-label">ภาษา / Language</span><div role="group" aria-labelledby="language-label"><button type="button" data-language="th" lang="th">ไทย</button><button type="button" data-language="en" lang="en">English</button></div></div>');
  const originals=new WeakMap();
  const attributes=new WeakMap();
  function visit(root){
    if(root.nodeType===Node.TEXT_NODE){
      if(root.parentElement?.closest('script,style,[translate="no"],.language-setting'))return;
      let entry=originals.get(root);if(!entry||root.nodeValue!==entry.output)entry={source:root.nodeValue};
      entry.output=translate(entry.source);originals.set(root,entry);if(root.nodeValue!==entry.output)root.nodeValue=entry.output;return;
    }
    if(root.nodeType!==Node.ELEMENT_NODE)return;
    if(root.matches('script,style,[translate="no"],.language-setting'))return;
    for(const attr of ['aria-label','title','placeholder'])if(root.hasAttribute(attr)){
      const entries=attributes.get(root)||{};let entry=entries[attr];const value=root.getAttribute(attr);
      if(!entry||value!==entry.output)entry={source:value};entry.output=translate(entry.source);entries[attr]=entry;attributes.set(root,entries);if(value!==entry.output)root.setAttribute(attr,entry.output);
    }
    for(const child of root.childNodes)visit(child);
  }
  const observer=new MutationObserver(records=>{observer.disconnect();for(const record of records){if(record.type==='childList')record.addedNodes.forEach(visit);else visit(record.target);}observe();});
  function observe(){observer.observe(document.querySelector('#app'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});}
  function apply(){observer.disconnect();document.documentElement.lang=language;visit(document.querySelector('#app'));settings.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));observe();}
  settings.querySelectorAll('[data-language]').forEach(button=>button.onclick=()=>{language=button.dataset.language;try{localStorage.setItem('crown-language',language);}catch{}apply();});
  apply();
}
