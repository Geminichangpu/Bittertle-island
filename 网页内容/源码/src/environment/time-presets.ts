export type TimeMode='day'|'dusk'|'night';
export type TimePreset={label:string;sky:string;sun:string;sunIntensity:number;sunPosition:[number,number,number];ambient:string;ground:string;ambientIntensity:number;exposure:number;fog:string;fogNear:number;fogFar:number;seaNear:string;seaFar:string;seaDetail:number;shoreTint:string;windowColor:string;windowIntensity:number;lampColor:string;lampIntensity:number;localIntensity:number};

/** Fixed art-direction presets, not a clock or an automatic day/night cycle. */
export const TIME_PRESETS:Record<TimeMode,TimePreset>={
 day:{label:'白天',sky:'#bedbd9',sun:'#fff0d5',sunIntensity:2.65,sunPosition:[-175,270,160],ambient:'#dfefed',ground:'#68785e',ambientIntensity:1.10,exposure:1.0,fog:'#bedbd9',fogNear:560,fogFar:1550,seaNear:'#70b0ad',seaFar:'#305e70',seaDetail:.025,shoreTint:'#e4f3ee',windowColor:'#ffcf8c',windowIntensity:0,lampColor:'#ffbc72',lampIntensity:0,localIntensity:0},
 dusk:{label:'黄昏',sky:'#d8a58b',sun:'#ffb266',sunIntensity:2.25,sunPosition:[-230,105,-100],ambient:'#c4abbd',ground:'#72615a',ambientIntensity:.95,exposure:1.03,fog:'#c5a0a2',fogNear:300,fogFar:1250,seaNear:'#7e9b9b',seaFar:'#3b596a',seaDetail:.012,shoreTint:'#c8a5a0',windowColor:'#ffd09a',windowIntensity:.32,lampColor:'#ffb86e',lampIntensity:1.1,localIntensity:24},
 night:{label:'夜晚',sky:'#0b142c',sun:'#adcaff',sunIntensity:.62,sunPosition:[160,210,-100],ambient:'#7397d4',ground:'#1c2b43',ambientIntensity:.55,exposure:1.03,fog:'#14243f',fogNear:260,fogFar:1150,seaNear:'#142f4c',seaFar:'#09192f',seaDetail:.003,shoreTint:'#435c85',windowColor:'#ffc77b',windowIntensity:.95,lampColor:'#ffb566',lampIntensity:2.4,localIntensity:48}
};
