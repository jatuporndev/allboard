import * as THREE from 'three';
import { mesh, joint, ellipsoid, cylinder, tube, relief, flame, ring } from './sculpture.js';
import { sculpt, sculptFace } from './anatomy.js';

export function crown(parent, p, type) {
  const royal = type === 'K', sage = type === 'M' || type === 'F';
  if(royal) {
    // A broad lotus coronet and a tall tiered spire belong only to the sovereign.
    sculpt(parent,p.gold,[[0,.154,.14,0],[.055,.163,.147,0],[.10,.147,.133,0],[.14,.12,.11,0]],32);
    for(const y of [.008,.077])ring(parent,p.gold,.158,.011,[0,y,0]);
    for(let i=0;i<8;i++) {
      const petal=joint(parent);petal.rotation.y=i*Math.PI/4;
      relief(petal,p.gold,[[-.044,.065],[-.048,.145],[0,.245],[.048,.145],[.044,.065]],.012,[0,0,-.136]);
      relief(petal,p.armor,[[-.024,.09],[0,.194],[.024,.09]],.010,[0,0,-.145]);
    }
    for(let i=0;i<6;i++) {
      const radius=.12-i*.016;
      cylinder(parent,p.gold,radius*.75,radius,.065,[0,.18+i*.065,0],24);
      ring(parent,p.armor,radius*.96,.006,[0,.16+i*.065,0]);
    }
    cylinder(parent,p.gold,0,.037,.18,[0,.61,0],20);
    for(const sign of [-1,1]) {
      flame(parent,p.gold,sign*.15,.015,-.005,.75,sign);
      tube(parent,p.gold,[[sign*.15,.03,-.055],[sign*.174,-.06,-.025],[sign*.146,-.12,.012]],.010);
    }
    const jewel=mesh(new THREE.OctahedronGeometry(.037),p.glow,parent,0,.10,-.158);jewel.scale.y=1.3;
    return;
  }
  if(['P','N','R'].includes(type)) {
    sculpt(parent,p.armor,[[-.012,.139,.125,0],[.045,.143,.128,.01],[.10,.119,.11,.015],[.155,.054,.057,.018],[.17,.008,.012,.018]],24);
    ring(parent,p.gold,.139,.007,[0,-.008,0]);
    for(const sign of [-1,1]) {
      relief(parent,p.armor,[[-.029,.035],[-.035,-.07],[0,-.11],[.035,-.06],[.028,.035]],.016,[sign*.123,-.044,.003]);
      if(type==='R')flame(parent,p.gold,sign*.13,.018,.025,.40,sign);
    }
    if(type==='N')tube(parent,p.cloth,[[0,.13,.03],[0,.20,.07],[0,.19,.16],[0,.08,.23]],.022);
    if(type==='R') {
      // An enclosed, ridged faceplate makes the heavy infantry silhouette distinct.
      sculpt(parent,p.armor,[[-.235,.066,.055,-.075],[-.19,.108,.067,-.060],[-.10,.124,.076,-.034],[-.045,.127,.086,-.013],[.005,.132,.096,0]],24);
      tube(parent,p.gold,[[0,.06,-.127],[0,-.10,-.142],[0,-.216,-.128]],.006);
      for(const sign of [-1,1]) {
        tube(parent,p.cloth,[[sign*.015,-.061,-.118],[sign*.07,-.047,-.105],[sign*.106,-.043,-.087]],.007);
        tube(parent,p.gold,[[sign*.118,-.041,-.084],[sign*.103,-.16,-.113],[sign*.058,-.217,-.125],[0,-.224,-.131]],.005);
      }
    }
    return;
  }
  if(type==='S') {
    sculpt(parent,p.cloth,[[0,.127,.119,.01],[.07,.132,.117,.01],[.13,.09,.088,.014],[.16,.014,.015,.015]],24);
    for(const y of [.02,.048,.076])ring(parent,p.gold,.131-y*.12,.005,[0,y,.01]);
    mesh(new THREE.OctahedronGeometry(.018),p.gold,parent,0,.047,-.115);
    return;
  }
  ellipsoid(parent, p.armor, [0, .06, .015], [.148, .12, .135]);
  ring(parent, p.gold, .145, .012, [0, .01, 0]);
  const tiers = royal ? 5 : sage ? 3 : type === 'S' ? 2 : 1;
  for (let i = 0; i < tiers; i++) {
    const r = .135 - i * .019;
    cylinder(parent, p.gold, r * .65, r, .065, [0, .14 + i * .065, .01]);
    ring(parent, p.armor, r * .84, .007, [0, .12 + i * .065, .01]);
  }
  cylinder(parent, p.gold, 0, .045, royal ? .19 : .13, [0, .17 + tiers * .065, .01]);
  if (type !== 'P') {
    for (const sign of [-1, 1]) {
      flame(parent, p.gold, sign * .125, -.025, -.015, royal ? .65 : .46, sign);
      ellipsoid(parent, p.gold, [sign * .148, -.055, .015], [.025, .095, .045]);
    }
  }
  mesh(new THREE.OctahedronGeometry(.03), p.glow, parent, 0, .06, -.135);
}

export function face(parent, p, type, bones = {}) {
  const guardian = type === 'R';
  sculptFace(parent, p, guardian);
  for (const sign of [-1, 1]) {
    ring(parent, p.gold, .03, .008, [sign * .145, -.07, 0], true);
    if (guardian) {
      tube(parent, p.blade, [[sign*.051,-.108,-.10],[sign*.055,-.081,-.13],[sign*.049,-.055,-.135]], .009);
      relief(parent,p.gold,[[0,.06],[-.022,0],[0,-.1],[.024,-.02]],.012,[sign*.103,-.023,-.047]);
    }
  }
  if(type==='S') {
    sculpt(parent,p.blade,[[-.225,.006,.009,-.065],[-.17,.039,.030,-.075],[-.12,.065,.035,-.071],[-.09,.061,.029,-.075]],20);
    for(const sign of [-1,1])tube(parent,p.blade,[[0,-.064,-.128],[sign*.028,-.073,-.12],[sign*.059,-.09,-.098]],.008);
  }
  const headwear=joint(parent,0,.09,0);
  crown(headwear,p,type);
  if(type==='K')bones.crown=headwear;
}

export function breastplate(parent, p, type) {
  const broad = type === 'R' || type === 'S';
  const body=sculpt(parent,p.armor,[[0,.145,.090,0],[.08,.157,.101,.005],[.18,.183,.123,0],[.28,.214,.140,-.006],[.35,.209,.121,.001],[.40,.156,.093,.008],[.44,.071,.065,.005]],24);
  if(broad)body.scale.x=1.12;
  if(type==='M')body.scale.x=.87;
  if(type==='K') {
    body.material=p.stone;
    // Broad ceremonial collar, royal sash and pendant replace the soldier's cuirass.
    relief(parent,p.gold,[[-.22,.34],[-.18,.42],[-.073,.44],[-.066,.365],[0,.31],[.066,.365],[.073,.44],[.18,.42],[.22,.34],[.15,.27],[0,.225],[-.15,.27]],.027,[0,0,-.137]);
    tube(parent,p.armor,[[-.19,.345,-.145],[-.13,.305,-.156],[0,.262,-.167],[.13,.305,-.156],[.19,.345,-.145]],.007);
    relief(parent,p.armor,[[-.16,.38],[-.105,.398],[.15,.057],[.105,.022]],.016,[0,0,-.151]);
    for(const sign of [-1,1])tube(parent,p.gold,[[sign*.16,.37,-.15],[sign*.12,.235,-.153],[sign*.10,.08,-.119]],.006);
    const seal=mesh(new THREE.OctahedronGeometry(.053),p.gold,parent,0,.265,-.179);seal.scale.y=1.3;
    mesh(new THREE.OctahedronGeometry(.025),p.glow,parent,0,.268,-.222);
    for(const sign of [-1,1])for(let i=0;i<4;i++)ellipsoid(parent,p.gold,[sign*(.042+i*.038),.29+i*.021,-.169],[.010,.013,.007]);
    cylinder(parent,p.gold,.18,.175,.061,[0,.026,0]);
    relief(parent,p.gold,[[-.051,.035],[-.051,-.035],[.051,-.035],[.051,.035]],.023,[0,.03,-.181]);
    return;
  }
  if(type==='R') {
    body.scale.z=1.10;
    for(const sign of [-1,1]) {
      tube(parent,p.gold,[[sign*.06,.415,-.071],[sign*.16,.36,-.102],[sign*.207,.29,-.092],[sign*.17,.09,-.079],[0,.035,-.112]],.007);
      tube(parent,p.gold,[[sign*.025,.33,-.160],[sign*.09,.346,-.150],[sign*.16,.315,-.137]],.004);
    }
    cylinder(parent,p.cloth,.175,.169,.048,[0,.018,0]);
    relief(parent,p.gold,[[-.024,.02],[-.024,-.02],[.024,-.02],[.024,.02]],.018,[0,.02,-.174]);
    return;
  }
  if(type==='P'||type==='N') {
    body.material=p.cloth;
    for(const sign of [-1,1]) {
      tube(parent,p.armor,[[sign*.14,.39,-.081],[sign*.15,.25,-.122],[sign*.124,.04,-.076]],.023);
      for(let i=0;i<3;i++)relief(parent,p.armor,[[-.061,.031],[-.06,-.025],[.06,-.025],[.061,.031]],.015,[sign*.073,.30-i*.060,-.137+i*.009]);
    }
    cylinder(parent,p.armor,.157,.154,.040,[0,.025,0]);
    relief(parent,p.gold,[[-.024,.018],[-.024,-.018],[.024,-.018],[.024,.018]],.014,[0,.027,-.161]);
    return;
  }
  if(type==='S') {
    body.material=p.cloth;
    for(let i=0;i<5;i++)tube(parent,i===0?p.gold:p.armor,[[-.17,.36-i*.023,-.09],[-.015,.26-i*.026,-.151],[.14,.17-i*.019,-.10]],i===0?.007:.014);
    for(let i=0;i<9;i++) {
      const angle=i/8*Math.PI;
      ellipsoid(parent,p.gold,[Math.cos(angle)*.106,.365-Math.sin(angle)*.105,-.117-Math.sin(angle)*.026],[.009,.011,.009]);
    }
    cylinder(parent,p.gold,.166,.159,.035,[0,.027,0]);
    return;
  }
  // Overlapping abdominal plates and curved chest seams follow the body.
  for(let i=0;i<3;i++) {
    relief(parent,p.armor,[[-.135,.034],[-.126,-.026],[0,-.045],[.126,-.026],[.135,.034],[0,.052]],.022,[0,.075+i*.052,-.108-i*.01]);
    tube(parent,p.gold,[[-.126,.064+i*.052,-.115-i*.01],[0,.041+i*.052,-.125-i*.01],[.126,.064+i*.052,-.115-i*.01]],.004);
  }
  for(const sign of [-1,1]) {
    tube(parent,p.gold,[[sign*.065,.415,-.05],[sign*.144,.367,-.092],[sign*.193,.30,-.084],[sign*.151,.241,-.12],[sign*.035,.235,-.142]],.008);
    tube(parent,p.gold,[[sign*.02,.33,-.147],[sign*.077,.346,-.14],[sign*.14,.323,-.124]],.005);
    for(let i=0;i<3;i++) {
      flame(parent,p.gold,sign*(.046+i*.038),.26+i*.016,-.14+i*.008,.16,sign);
      ellipsoid(parent,p.gold,[sign*(.083+i*.039),.372-i*.028,-.108],[.006,.006,.006]);
    }
  }
  flame(parent,p.gold,0,.28,-.159,.27);
  mesh(new THREE.OctahedronGeometry(.026),p.glow,parent,0,.285,-.165);
  cylinder(parent, p.gold, .18, .175, .047, [0, .025, 0]);
  mesh(new THREE.OctahedronGeometry(.045), p.gold, parent, 0, .025, -.18);
}

export function shoulder(parent, p, sign, large = false, type = 'K') {
  if(type==='K') {
    ellipsoid(parent,p.gold,[0,.009,.01],[.116,.066,.133]);
    // Layered epaulettes sweep outwards instead of sharing the attendant's flame armor.
    for(let i=0;i<3;i++) {
      relief(parent,p.gold,[[-.087,.017],[-.075,-.056],[0,-.085],[.084,-.046],[.092,.015]],.018,[sign*i*.012,-i*.033,-.11]);
    }
    for(let i=0;i<5;i++)tube(parent,p.gold,[[sign*.075,-.015,.07-i*.033],[sign*.098,-.085,.07-i*.033]],.006);
    return;
  }
  if(['P','N','S'].includes(type)) {
    ellipsoid(parent,type==='S'?p.cloth:p.armor,[0,-.015,0],[.093,.068,.109]);
    if(type==='S')tube(parent,p.gold,[[-.07,-.04,-.073],[0,-.058,-.11],[.07,-.04,-.073]],.006);
    return;
  }
  ellipsoid(parent, p.armor, [0, -.015, 0], [large ? .135 : .105, .087, .14]);
  flame(parent, p.gold, sign * .055, -.04, -.09, large ? .7 : .46, sign);
  for (let i = 0; i < 2; i++) {
    relief(parent, p.gold, [[-.07, 0], [-.065, -.065], [0, -.095], [.065, -.065], [.07, 0]], .02, [0, -.05 - i * .05, -.105]);
  }
}

export function skirt(parent, p, long = false, type = 'K') {
  if(type==='K') {
    sculpt(parent,p.stone,[[-.29,.231,.157,.012],[-.23,.222,.15,.012],[-.10,.182,.123,0],[.02,.16,.10,0]],24);
    for(const sign of [-1,1]) {
      const panel=joint(parent,sign*.105,-.006,-.155);panel.rotation.y=sign*.12;
      relief(panel,p.armor,[[-.080,0],[-.075,-.29],[0,-.35],[.075,-.29],[.080,0]],.014);
      tube(panel,p.gold,[[-.069,-.025,-.008],[-.062,-.28,-.008],[0,-.326,-.008],[.062,-.28,-.008],[.069,-.025,-.008]],.005);
      flame(panel,p.gold,0,-.24,-.014,.40,sign);
    }
    return;
  }
  if(type==='S') {
    sculpt(parent,p.cloth,[[-.40,.21,.147,.015],[-.31,.219,.15,.015],[-.12,.187,.129,.015],[.018,.156,.10,.015]],24);
    for(const sign of [-1,1])for(let i=0;i<3;i++)tube(parent,p.armor,[[sign*(.07+i*.029),-.035,-.097],[sign*(.10+i*.037),-.20,-.118],[sign*(.10+i*.043),-.38,-.12]],.006);
    return;
  }
  cylinder(parent, p.cloth, .16, .235, long ? .42 : .20, [0, long ? -.17 : -.075, .015]);
  const count=type==='P'||type==='N'?4:8;
  for (let i = 0; i < count; i++) {
    const panel = joint(parent);
    panel.rotation.y = i * Math.PI * 2 / count;
    relief(panel, p.armor, [[-.065, 0], [-.075, -.17], [0, -.22], [.075, -.17], [.065, 0]], .025, [0, 0, -.17]);
    if(type!=='P')tube(panel, p.gold, [[-.055, -.03, -.185], [0, -.185, -.2], [.055, -.03, -.185]], .006);
  }
}

export function sword(parent, p, heavy = false) {
  const weapon = joint(parent, 0, -.04, 0);
  cylinder(weapon, p.cloth, .025, .025, .14, [0, 0, 0]);
  ring(weapon, p.gold, .035, .013, [0, -.075, 0]);
  ellipsoid(weapon, p.gold, [0, .07, 0], [.115, .025, .043]);
  const width = heavy ? .072 : .038, length = heavy ? .6 : .52;
  relief(weapon, p.blade, [[-width, .1], [-width, length * .8], [0, length + .12], [width * 1.5, length * .83], [width, .1]], .018, [0, 0, -.008]);
  tube(weapon, p.gold, [[0, .1, -.014], [.006, length * .75, -.014], [0, length + .1, -.014]], .004);
  flame(weapon, p.gold, .075, .058, 0, .23);
  return { weapon, tip: joint(weapon, 0, length + .12, 0) };
}

export function spear(parent, p, ornate = false) {
  const weapon = joint(parent, 0, -.04, 0);
  cylinder(weapon, p.armor, .019, .023, 1.12, [0, .16, 0]);
  for (const y of [-.34, .02, .09, .16, .58]) ring(weapon, p.gold, .024, .008, [0, y, 0]);
  relief(weapon, p.blade, [[0, .95], [-.062, .73], [0, .66], [.062, .73]], .018, [0, 0, -.009]);
  if (ornate) for (const sign of [-1, 1]) flame(weapon, p.gold, sign * .025, .60, 0, .42, sign);
  return { weapon, tip: joint(weapon, 0, .95, 0) };
}

export function staff(parent, p) {
  const weapon = joint(parent);
  cylinder(weapon, p.armor, .024, .03, 1.0, [0, .15, 0]);
  for (let i = 0; i < 7; i++) ring(weapon, p.gold, .028, .008, [0, -.25 + i * .13, 0]);
  ring(weapon, p.gold, .12, .02, [0, .77, 0], true);
  for (const sign of [-1, 1]) flame(weapon, p.gold, sign * .08, .66, 0, .45, sign);
  mesh(new THREE.OctahedronGeometry(.085), p.glow, weapon, 0, .77, 0);
  return { weapon, tip: joint(weapon, 0, .77, 0) };
}

export function shield(parent, p, tower = false) {
  const object = joint(parent, 0, -.02, -.035);
  const w = tower ? .18 : .14, h = tower ? .5 : .32;
  const outline = [[0, h * .6], [-w, h * .38], [-w, -h * .25], [0, -h * .6], [w, -h * .25], [w, h * .38]];
  relief(object, p.gold, outline, .03, [0, 0, -.03]);
  const inner = relief(object, p.armor, outline, .03, [0, 0, -.055]);
  inner.scale.set(.86, .87, 1);
  ellipsoid(object, p.gold, [0, 0, -.095], [.058, .07, .025]);
  flame(object, p.gold, 0, .055, -.095, tower ? .5 : .32);
  for (const x of [-w * .7, w * .7]) for (const y of [-h * .18, h * .25]) ellipsoid(object, p.gold, [x, y, -.096], [.012, .012, .01]);
  return object;
}

export function cape(parent, p, king = false, bones = {}) {
  const object = joint(parent, 0, .37, .13);
  const length=king?.80:.64, count=4, segment=length/count;
  let previous=object;
  for(let part=0;part<count;part++) {
    const panel=joint(previous,0,part?-segment:0,part?.025:0);
    bones[`cape${part}`]=panel;
    const positions=[],uv=[],indices=[],rows=4,cols=16;
    const point=(v,u)=>{
      const t=(part+v)/count;
      return [(u-.5)*(king?.48+t*.34:.30+t*.28),-v*segment,.04+v*.025+Math.sin(u*Math.PI*8)*(.009+t*.018)];
    };
    for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++) {
      positions.push(...point(row/rows,col/cols));uv.push(col/cols,(part+row/rows)/count);
    }
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++) {
      const i=row*(cols+1)+col;indices.push(i,i+1,i+cols+1,i+1,i+cols+2,i+cols+1);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
    mesh(geo,p.cloth,panel);
    for(const u of [0,1])tube(panel,p.gold,[point(0,u),point(.5,u),point(1,u)],.006);
    if(king) {
      for(const u of [.045,.955])tube(panel,p.gold,[point(0,u),point(.5,u),point(1,u)],.004);
      if(part===1)flame(panel,p.gold,0,-.18,.07,.55);
    }
    if(part===count-1)tube(panel,p.gold,Array.from({length:17},(_,i)=>point(1,i/16)),.006);
    previous=panel;
  }
  return object;
}
