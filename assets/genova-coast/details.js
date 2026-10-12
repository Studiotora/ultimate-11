/* Small-scale architectural storytelling. Geometry is folded into the world batches. */
(()=>{'use strict';window.addCoastDetails=function(T,root,buildings,box,cylinder,collision){
const A=CoastArt,stone=A.material(0xd0c5a6,'stone',2),iron=A.material(0x516666,'wood',2),wood=A.material(0xc6ac80,'wood',2),brick=A.material(0xdbbaa0,'paving',3),cloth=A.material(0xf5e6c6,'plaster',6);
function pipe(a,b,r=.025,color=0x667774){const d=new T.Vector3().subVectors(b,a),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),5),A.material(color,'wood',2));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());root.add(m)}
function flowers(x,y,z,size=.32){box(size*2,.2,.32,x,y,z,A.material(0xc99271,'roof',3));A.cluster(root,x,y+.28,z+.02,size,true)}
for(let index=0;index<buildings.length;index++){const {x,z,w,d,h}=buildings[index],f=z+d/2;
 // Worn rusticated stone bases, pilasters, eave brackets and gutters.
 for(const side of [-1,1]){for(let y=.2;y<h-.6;y+=.52)box(.38,.44,.18,x+side*(w/2-.17),y,f+.12,stone);for(let y=.18;y<1.2;y+=.32)box(w-.5,.28,.1,x,y,f+.08,brick)}
 for(let k=0;k<Math.floor(w/.55);k++){const xx=x-w/2+.3+k*.55;box(.13,.24,.32,xx,h-.33,f+.15,stone);}
 box(w+.55,.12,.16,x,h-.08,f+.37,iron);
 // Shutter ironwork, visible hinges, sills and flower boxes on selected upper windows.
 const cols=Math.max(2,Math.floor(w/1.9)),floors=Math.floor((h-1)/2.2);
 for(let floor=0;floor<floors;floor++){const yy=2.8+floor*2.05;if(yy+1>h-.3)continue;for(let k=0;k<cols;k++){const xx=x+(k-(cols-1)/2)*w/(cols+.25);for(const side of [-1,1]){box(.3,.045,.03,xx+side*.57,yy-.36,f+.245,iron);box(.3,.045,.03,xx+side*.57,yy+.37,f+.245,iron)}if((index+k+floor)%4===0)flowers(xx,yy-.64,f+.4,.41)}}
 // Ground-level shop glazing, door panels, tiled thresholds and a folding menu board.
 for(const side of [-1,1]){const xx=x+side*w*.29;box(1.14,1.38,.18,xx,.85,f+.22,stone);box(.92,1.15,.19,xx,.9,f+.31,CoastArt.windowGlass(xx,.9,f));box(1.18,.1,.43,xx,.16,f+.3,stone)}
 box(1.35,.09,.64,x,.055,f+.45,stone);for(let p=0;p<3;p++)box(.67,.39,.05,x,.37+p*.51,f+.32,wood);
 cylinder(.055,.055,.13,x+.27,.87,f+.4,0xbca575,6);
 // Wall lamps, vents, wiring and ceramic civic numbers.
 box(.14,.2,.22,x+w*.39,2.1,f+.19,iron);box(.3,.35,.15,x+w*.39,2.19,f+.33,A.material(0xf3d59a,'stone',1));
 for(let q=0;q<7;q++)box(.055,.28,.02,x-w*.32-.29+q*.1,2.02,f+.398,iron);
 pipe(new T.Vector3(x-w/2,2.4,f+.13),new T.Vector3(x+w/2,2.4,f+.13),.017,0x5b675f);
 if(index%2===0){const panel=box(.7,.84,.06,x+w*.41,.5,f+1.64,A.material(0x324e4b,'wood',2));panel.rotation.x=-.12;for(let j=0;j<4;j++)box(.4-.04*j,.025,.02,x+w*.41,.7-j*.14,f+1.71,0xccceb2);collision(x+w*.41,f+1.64,.8,.35)}
}
// Café: woven seats, cups, bottles and a barrel table. These sit inside existing furniture bounds.
for(const [x,z] of [[-10.4,-3.3],[-7.1,-3.3],[-11,1.1]]){for(const a of [-1,1]){cylinder(.065,.065,.14,x+a*.23,.965,z,0xf3e3bc,8);cylinder(.1,.1,.02,x+a*.23,.895,z,0xdfd2ad,10)}cylinder(.08,.12,.30,x,.98,z+.15,0x4c6c4d);for(const a of [-1,1])for(let j=0;j<4;j++)box(.045,.45,.035,x+a*1.02-.20+j*.13,.72,z-.29,wood)}
function crate(x,z){box(.74,.62,.64,x,.31,z,wood);for(let i=0;i<5;i++){box(.68,.065,.055,x,.08+i*.12,z+.33,stone);box(.055,.55,.055,x-.29,.31,z+.36,iron);box(.055,.55,.055,x+.29,.31,z+.36,iron)}collision(x,z,.8,.7)}
crate(-19.4,10.5);crate(-18.55,10.7);crate(10.8,-6.5);
// Coiled mooring ropes, drain grates and grass emerging from quay cracks.
for(const [x,z] of [[-8.7,7.3],[5.4,7.3],[-11.1,13.2],[18.4,11.1]])for(let k=0;k<4;k++){const m=new T.Mesh(new T.TorusGeometry(.16+k*.047,.025,4,16),wood);m.rotation.x=-Math.PI/2;m.position.set(x,.15,z);root.add(m)}
for(const [x,z] of [[-6,5.8],[7,3],[-12,-1],[13,8.4]]){box(.65,.02,.38,x,.096,z,iron);for(let k=0;k<6;k++)box(.045,.022,.3,x-.23+k*.09,.11,z,stone)}
// Flowering vines soften façades without covering the paths or interaction points.
for(const [x,z,h] of [[-14.5,-6.7,4.8],[10.9,-7.7,5.5],[-20.35,3.4,3.6]]){for(let i=0;i<7;i++)A.cluster(root,x+Math.sin(i)*.2,.6+i*h/7,z,.29+i*.03,i%3===0)}
// Distinctive Ligurian red-brick and white-stone pavement border.
for(let x=-10;x<10;x+=.48)box(.42,.028,.28,x,.105,7.56,x%1<.5?brick:stone);
};})();
