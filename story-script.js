/* ════════════════════════════════════════════════════════════
   LA NUOVA STELLA · STORY SCRIPT v2 (game integration)
   ─ Per-club casts: Genoa staff ≠ Sampdoria staff (aliases resolve
     to YOUR club; the other club's staff appears in the derby).
   ─ Rival's school (San Giorgio) has its own coach & captain.
   ─ CH.4: the rival is ALSO called up — rivals become teammates.
   Tokens: {HERO} {RIVAL} {CLUB} {RIVALCLUB} {COACH} {CAPT} {GK} {OPPCAPT}
   Alias 'who': coach-club / captain-club / gk-club / coach-opp / captain-opp / gk-opp
   Cast portraits: assets/story/cast/{id}.png   (hero & rival reuse the
   role/phase hero-art slots from the game)
   ════════════════════════════════════════════════════════════ */
window.STORY_CAST={
  hero:{name:'{HERO}'},
  rival:{name:'{RIVAL}'},
  'coach-school':{name:'MISTER FABBRI'},
  'captain-school':{name:'GRECO'},
  'gk-school':{name:'TOGNOLI'},
  'coach-sgiorgio':{name:'MISTER ORLANDO'},
  'captain-sgiorgio':{name:'MAURO'},
  scout:{name:'SIG. MARCHETTI'},
  'coach-genoa':{name:'MISTER CATTANEO'},
  'captain-genoa':{name:'CAPITAN FERRI'},
  'gk-genoa':{name:'BASSI'},
  'coach-doria':{name:'MISTER LANZA'},
  'captain-doria':{name:'CAPITAN SERRA'},
  'gk-doria':{name:'PALUMBO'},
  ct:{name:'CT ROMANO'},
  'captain-ita':{name:'CAPITAN VITALE'},
  kaito:{name:'KAITO AOYAMA'}
};
window.STORY_ALIAS={
  FW:{'coach-club':'coach-genoa','captain-club':'captain-genoa','gk-club':'gk-genoa',
      'coach-opp':'coach-doria','captain-opp':'captain-doria','gk-opp':'gk-doria'},
  CA:{'coach-club':'coach-doria','captain-club':'captain-doria','gk-club':'gk-doria',
      'coach-opp':'coach-genoa','captain-opp':'captain-genoa','gk-opp':'gk-genoa'}
};

window.STORY_SCRIPT={
/* ═══ CAPITOLO 1 · TORNEO INTERSCOLASTICO ═══ */
ch1_intro:{title:'CAPITOLO 1 · PRIMAVERA, GENOVA',lines:[
 {who:'hero',text:'Ultimo anno. Ultimo torneo. Dopo questo... o il calcio diventa la mia vita, o resta solo un sogno da cortile.'},
 {who:'coach-school',text:'{HERO}! Smettila di fissare il porto e vieni qui. Il torneo inizia tra tre giorni e tu sei il motivo per cui non dormo.'},
 {who:'hero',text:'Anche lei mi vuole bene, Mister.'},
 {who:'coach-school',text:'Ti voglio CONCENTRATO. C\'è gente importante che guarda questi tornei. Gente con il taccuino.'},
 {who:'captain-school',text:'Lascia stare i taccuini. Pensiamo a vincere: ogni squadra di Genova vuole la nostra testa.'},
 {who:'hero',text:'Allora faremo in modo che non la tocchino mai.'}]},
ch1_pre_qf:{title:'QUARTI · SPOGLIATOIO',lines:[
 {who:'gk-school',text:'Ragazzi... se mi fanno gol su punizione di nuovo, io cambio sport. Giuro. Pallanuoto.'},
 {who:'captain-school',text:'{SCHOOLGK}, l\'anno scorso hai parato un rigore con la faccia. Sei il nostro muro.'},
 {who:'gk-school',text:'Era la faccia o il palo? Non l\'ho mai capito.'},
 {who:'hero',text:'Oggi non ti serve la faccia. Oggi la palla resta dall\'altra parte del campo. Promesso.'},
 {who:'coach-school',text:'Belle parole. Ora dimostrale. ANDIAMO!'}]},
ch1_post_qf_win:{title:'QUARTI · FINE PARTITA',lines:[
 {who:'captain-school',text:'Visto?! VISTO?! È così che si gioca!'},
 {who:'hero',text:'Una alla volta, capitano. La prossima è peggio.'},
 {who:'coach-school',text:'Per una volta sono d\'accordo col ragazzino. Recupero, ghiaccio, e a letto presto. TUTTI.'}]},
ch1_pre_sf:{title:'SEMIFINALE · TUNNEL',lines:[
 {who:'captain-school',text:'{HERO}. Senti... questo è il mio ultimo torneo. Io l\'università, il calcio per me finisce qui.'},
 {who:'hero',text:'Capitano...'},
 {who:'captain-school',text:'Niente facce tristi. Voglio solo dirti: tu hai qualcosa che noi non abbiamo. Non sprecarlo. Mai.'},
 {who:'hero',text:'Allora vinciamolo insieme, questo torneo. Te lo devo.'},
 {who:'captain-school',text:'Me lo devi eccome. Andiamo.'}]},
ch1_final_locker:{title:'FINALE · IL SAN GIORGIO',lines:[
 {who:'captain-sgiorgio',text:'{SCHOOL}. Vi aspettavamo. {RIVAL} non parla d\'altro da una settimana.'},
 {who:'hero',text:'{RIVALSCHOOLCAPT}. Dicono che la vostra {RIVALSCHOOL} non abbia ancora subito un gol in tutto il torneo.'},
 {who:'captain-sgiorgio',text:'E resterà così. Abbiamo studiato ogni tua giocata. Ogni singola.'},
 {who:'coach-sgiorgio',text:'{RIVALSCHOOLCAPT}! Dentro. Non si parla col nemico prima della battaglia.'},
 {who:'hero',text:'...Hanno paura. Bene. Significa che ci rispettano.'}]},
ch1_pre_final:{title:'FINALE · TE E ME',lines:[
 {who:'rival',text:'Eccoci, {HERO}. Tutta Genova in una partita. Te e me. Come sui campetti.'},
 {who:'hero',text:'Sui campetti vincevo io.'},
 {who:'rival',text:'Vincevi PRIMA. Poi sono cresciuto. Un livello sopra di te, sempre. Oggi te lo dimostro davanti a tutti.'},
 {who:'hero',text:'Sai qual è la differenza tra noi, {RIVAL}? Tu giochi per dimostrare. Io gioco perché senza non respiro.'},
 {who:'rival',text:'...Heh. Allora oggi smettiamo di respirare in due. In campo.'}]},
ch1_post_final_win:{title:'FINALE · CAMPIONI',lines:[
 {who:'captain-school',text:'CAMPIONI! L\'abbiamo fatto! L\'ABBIAMO FATTO DAVVERO!'},
 {who:'gk-school',text:'Ho parato. Con le MANI. Avete visto tutti, vero? Le mani!'},
 {who:'rival',text:'...Bella partita, {HERO}. Oggi. Solo oggi. Questa coppa non cambia niente tra noi.'},
 {who:'hero',text:'Cambia tutto, invece. Ora sai dove trovarmi: davanti a te.'}]},
ch1_post_final_loss:{title:'FINALE · A TESTA ALTA',lines:[
 {who:'rival',text:'Te l\'avevo detto. Un livello sopra. Sempre.'},
 {who:'hero',text:'Goditela, {RIVAL}. È l\'ultima volta che mi vedi da quaggiù.'},
 {who:'captain-school',text:'Testa alta, {HERO}. Hai giocato la partita della vita. E qualcuno se n\'è accorto... guarda là. L\'uomo col cappotto grigio.'}]},
ch1_scout:{title:'L\'UOMO COL CAPPOTTO GRIGIO',lines:[
 {who:'scout',text:'{HERO}, giusto? Marchetti. Osservatore. Ti seguo da tre partite.'},
 {who:'hero',text:'Osservatore... di chi?'},
 {who:'scout',text:'Del {CLUB}. Serie B. Squadra vera, stadio vero, tifosi che non perdonano. Vogliamo farti firmare.'},
 {who:'hero',text:'Io... sì. SÌ. Dove devo firmare? Posso firmare adesso?'},
 {who:'scout',text:'Ah, i giovani. Prima una cosa: anche la {RIVALSCHOOL} ha avuto visite. Il tuo amico {RIVAL} firma per il {RIVALCLUB}.'},
 {who:'hero',text:'...Certo che firma. Non sarebbe divertente, altrimenti.'},
 {who:'scout',text:'Benvenuto nel calcio vero, ragazzo. La Serie B ti aspetta.'}]},

/* ═══ CAPITOLO 2 · SERIE B ═══ */
ch2_arrival:{title:'CAPITOLO 2 · PRIMO GIORNO AL {CLUB}',lines:[
 {who:'coach-club',text:'Quindi tu saresti il fenomeno del torneo scolastico. Qui i fenomeni li mando a raccogliere i coni.'},
 {who:'hero',text:'Allora raccoglierò i coni più in fretta di chiunque, Mister.'},
 {who:'coach-club',text:'...Risposta giusta. {CAPT}! Vieni qui. Il nuovo è tuo: spezzalo, poi rimettilo insieme.'},
 {who:'captain-club',text:'Quindici anni che gioco in B, ragazzino. Ne ho visti cento come te. Novantanove sono tornati a casa.'},
 {who:'hero',text:'Bene. Sarò il numero cento che resta.'},
 {who:'captain-club',text:'Heh. Vedremo, numero cento. Vedremo.'}]},
ch2_training:{title:'ALLENAMENTO · IL PORTIERE',lines:[
 {who:'gk-club',text:'Ehi, scolaretto. Tira pure. Tanto qui non passa neanche l\'aria.'},
 {who:'hero',text:'L\'aria no. Ma il pallone sì.'},
 {who:'gk-club',text:'...L\'hai messa all\'incrocio. Al primo tiro. Chi diavolo sei?'},
 {who:'hero',text:'Quello che ti farà diventare il portiere più forte della B. Da domani, ogni allenamento, tiro finché non mi pari tutto.'},
 {who:'gk-club',text:'...Affare fatto, scolaretto. Ma quando ti paro tutto, mi paghi la cena.'}]},
ch2_pre_md1:{title:'ESORDIO IN SERIE B',lines:[
 {who:'captain-club',text:'Senti il rumore? Quello è uno stadio vero. Quindicimila persone che oggi giudicano ogni tuo tocco.'},
 {who:'hero',text:'Il cuore mi esce dal petto, capitano.'},
 {who:'captain-club',text:'Bene. Il giorno che non succede più, smetti. Ora ascolta: primo pallone, gioca semplice. Il resto viene da sé.'},
 {who:'hero',text:'Primo pallone semplice. Secondo pallone... mio.'},
 {who:'captain-club',text:'HAH! Andiamo, numero cento.'}]},
ch2_derby_pre:{title:'IL DERBY DELLA LANTERNA',lines:[
 {who:'rival',text:'Il derby di Genova. Lo sognavamo da bambini, sul molo. Ti ricordi cosa dicevamo?'},
 {who:'hero',text:'"Chi segna nel derby diventa leggenda." Me lo ricordo.'},
 {who:'rival',text:'Oggi uno di noi due diventa leggenda. L\'altro guarda. Indovina chi sono io?'},
 {who:'hero',text:'Quello che guarda. Come sempre, un passo dietro a chiacchierare.'},
 {who:'captain-opp',text:'{RIVAL}! Smettila di fraternizzare. E tu, ragazzino... oggi scoprirai cos\'è davvero questa città.'},
 {who:'rival',text:'...Novanta minuti, {HERO}. Tutta la città. Non deludermi.'}]},
ch2_derby_post:{title:'DOPO IL DERBY',lines:[
 {who:'captain-opp',text:'...Hai stoffa, ragazzino. Mi spiace solo che la sprechi con la maglia sbagliata.'},
 {who:'hero',text:'A Genova non ci sono maglie sbagliate, capitano. Solo due metà dello stesso cuore.'},
 {who:'captain-opp',text:'Heh. Risposta da vecchio saggio. {RIVAL} aveva ragione su di te. Ci rivediamo al ritorno.'}]},
ch2_phone_mid:{title:'TELEFONATA · NOTTE',lines:[
 {who:'rival',text:'Ho visto il tuo gol in TV stasera. Non riattaccare.'},
 {who:'hero',text:'...Tu che mi chiami per un complimento? Chi è morto?'},
 {who:'rival',text:'Nessuno, idiota. Ti chiamo per dirti di non rallentare. Se molli adesso, batterti non varrà niente.'},
 {who:'hero',text:'Serie A, {RIVAL}. Tutti e due. Poi facciamo i conti.'},
 {who:'rival',text:'Serie A. Tutti e due. Ora dormi, che domani ti alleni male e mi fai sfigurare.'}]},
ch2_promotion:{title:'PROMOZIONE!',lines:[
 {who:'captain-club',text:'Quindici anni... quindici anni ho aspettato questo momento. SERIE A! E ce l\'hai portata tu, numero cento.'},
 {who:'hero',text:'Ce l\'abbiamo portata insieme, capitano. Tu mi hai spezzato e rimesso insieme, ricordi?'},
 {who:'coach-club',text:'Basta abbracci. La Serie A non perdona NIENTE. Ma stasera... stasera si festeggia.'},
 {who:'gk-club',text:'E mi devi ancora una cena, scolaretto! Stasera paghi tu!'}]},

/* ═══ CAPITOLO 3 · SERIE A ═══ */
ch3_arrival:{title:'CAPITOLO 3 · IL GRANDE PALCOSCENICO',lines:[
 {who:'coach-club',text:'Serie A. San Siro, l\'Olimpico, lo Stadium. I difensori qui leggono il tuo primo controllo prima che tu pensi di farlo.'},
 {who:'hero',text:'Allora penserò più veloce di loro.'},
 {who:'coach-club',text:'E c\'è un\'altra cosa. Prima del campionato giochiamo un\'amichevole internazionale. Contro una nazionale vera. Il mondo ti guarda, ragazzo.'},
 {who:'hero',text:'Una nazionale... Mister, è quello che aspetto da tutta la vita.'},
 {who:'captain-club',text:'Allora smetti di sorridere e inizia a correre, numero cento. Il mondo non aspetta nessuno.'}]},
ch3_friendly_pre:{title:'AMICHEVOLE INTERNAZIONALE',lines:[
 {who:'captain-club',text:'Guardali. Una nazionale intera dall\'altra parte. Ognuno di loro ha giocato un Mondiale.'},
 {who:'hero',text:'E ognuno di loro stasera si ricorderà il mio nome.'},
 {who:'captain-club',text:'Heh. Una volta quella frase l\'avrei chiamata arroganza. Adesso la chiamo {HERO}. Vai e fatti vedere dal mondo.'}]},
ch3_press:{title:'DOPO LA PARTITA · I GIORNALI',lines:[
 {who:'gk-club',text:'"La nuova stella del calcio italiano." Sei sul giornale, scolaretto. Su TUTTI i giornali.'},
 {who:'hero',text:'I giornali di oggi incartano il pesce di domani. Conta solo la prossima partita.'},
 {who:'gk-club',text:'Senti questa, però: "Il CT Romano era in tribuna." IL CT, {HERO}. Quello della Nazionale.'},
 {who:'hero',text:'...Allora la prossima partita conta il doppio.'}]},
ch3_callup:{title:'LA CHIAMATA',lines:[
 {who:'ct',text:'{HERO}. Sono Romano. Sai perché ti chiamo.'},
 {who:'hero',text:'...Lo so. Ma ho bisogno di sentirlo dire, CT.'},
 {who:'ct',text:'Il Mondiale. Maglia azzurra. Voglio il ragazzo che ha zittito una nazionale intera in amichevole. Ci sei?'},
 {who:'hero',text:'CT... ci sono da quando avevo sei anni e calciavo contro il muro del porto.'},
 {who:'ct',text:'Bene. Ritiro a Coverciano, lunedì. Ah, un\'ultima cosa. Non sarai l\'unico genovese in ritiro: convoco anche {RIVAL}.'},
 {who:'hero',text:'...{RIVAL}?! Dopo tutti questi anni... compagni di squadra?'},
 {who:'ct',text:'I due ragazzi del molo, finalmente dalla stessa parte. Vediamo cosa succede quando smettete di farvi la guerra.'}]},

/* ═══ CAPITOLO 4 · IL MONDIALE · il rivale è in squadra ═══ */
ch4_ritiro:{title:'CAPITOLO 4 · COVERCIANO',lines:[
 {who:'rival',text:'...Quindi è vero. Hanno convocato anche te.'},
 {who:'hero',text:'Convocato anche ME?! Io sono arrivato un\'ora prima, {RIVAL}. Tu sei quello "anche".'},
 {who:'rival',text:'Dieci anni di rivalità e adesso devo passarti il pallone. Il destino ha un pessimo senso dell\'umorismo.'},
 {who:'hero',text:'O forse ottimo. Tutto quello che ci siamo dati addosso per anni... adesso lo diamo agli altri. Insieme.'},
 {who:'rival',text:'...Insieme. Che parola strana, detta a te. Vediamo se in campo suona meglio.'},
 {who:'captain-ita',text:'Voi due! I ragazzi di Genova. Qui dentro conta una cosa sola: la maglia. Le vostre guerre lasciatele al molo.'},
 {who:'hero',text:'Capitano... le nostre guerre sono il motivo per cui siamo qui. Ma da oggi, combattiamo dalla stessa parte.'}]},
ch4_friendly_pre:{title:'AMICHEVOLE PRE-MONDIALE',lines:[
 {who:'ct',text:'Ultima prova prima del Mondiale. Stasera capisco chi parte titolare e chi guarda.'},
 {who:'hero',text:'CT, io non sono venuto fin qui per guardare.'},
 {who:'rival',text:'Nemmeno io. E se giochiamo insieme, CT... le difese non sapranno chi dei due guardare.'},
 {who:'ct',text:'È esattamente quello che voglio scoprire. Stasera giocate INSIEME. Non deludetemi, ragazzi del molo.'}]},
ch4_wc_open:{title:'MONDIALE · LA NOTTE PRIMA · STANZA 214',lines:[
 {who:'rival',text:'Compagni di stanza. Il CT l\'ha fatto apposta, lo sai vero?'},
 {who:'hero',text:'Ovvio. Vuole vedere se ci ammazziamo prima dell\'esordio.'},
 {who:'rival',text:'...Ti ricordi il molo? Dicevamo: "un giorno giocheremo il Mondiale". Mai detto "contro". Mai detto "insieme". Solo... il Mondiale.'},
 {who:'hero',text:'E domani ci entriamo. Tutti e due. Genova in mezzo al campo.'},
 {who:'rival',text:'Fammi una promessa: il primo gol del Mondiale è del molo. Tuo su mio assist, o mio sul tuo. Comunque vada, segna Genova.'},
 {who:'hero',text:'...Il molo segna. Promesso. Ora dormi, che russi anche da sveglio.'}]},
ch4_semi_pre:{title:'SEMIFINALE · SPOGLIATOIO AZZURRO',lines:[
 {who:'captain-ita',text:'A novanta minuti dalla finale del Mondiale. Sentite le gambe?'},
 {who:'hero',text:'Tremano, capitano.'},
 {who:'rival',text:'Le mie no. Tremano gli avversari, piuttosto: hanno visto cosa facciamo quando giochiamo insieme.'},
 {who:'captain-ita',text:'HAH! Dieci anni a odiarvi e adesso siete la coppia più temuta del torneo. Andiamo a prenderci la finale, ragazzi del molo.'}]},
ch4_final_pre:{title:'LA FINALE · ITALIA vs GIAPPONE',lines:[
 {who:'kaito',text:'{HERO} della Nuova Stella. E {RIVAL}, l\'ombra che è diventata luce. In Giappone i bambini imitano già le vostre giocate.'},
 {who:'hero',text:'Kaito Aoyama. Il dieci che ha segnato in ogni partita di questo Mondiale. L\'onore è nostro.'},
 {who:'kaito',text:'Da bambino calciavo contro un muro a Shizuoka. Voi contro un muro a Genova, ho letto. Tre muri, lo stesso sogno.'},
 {who:'rival',text:'Con una differenza, Aoyama: noi siamo in due. E stanotte lo scoprirai.'},
 {who:'kaito',text:'Lo spero. Datemi tutto, ragazzi del molo. Il calcio merita una finale leggendaria.'}]},
ch4_final_win:{title:'CAMPIONI DEL MONDO',lines:[
 {who:'kaito',text:'...Una partita che ricorderanno per cent\'anni. Il trofeo è vostro. Stanotte, il muro di Genova ha vinto.'},
 {who:'hero',text:'A Shizuoka e a Genova, Kaito... i bambini stanno ancora calciando. È questo che abbiamo vinto davvero.'},
 {who:'rival',text:'{HERO}... ce l\'abbiamo fatta. Dieci anni a spingerci l\'un l\'altro... ed era tutto per QUESTA notte.'},
 {who:'hero',text:'Un livello sopra di me, dicevi. Avevi ragione: senza di te a inseguirmi, non sarei mai arrivato qui.'},
 {who:'rival',text:'E io senza te davanti. ...Va bene, basta. ALZIAMO QUESTA COPPA PRIMA CHE MI VEDANO PIANGERE.'},
 {who:'captain-ita',text:'RAGAZZI DEL MOLO! La coppa! L\'ITALIA È CAMPIONE DEL MONDO!'},
 {who:'hero',text:'Dal molo di Genova al tetto del mondo. LA NUOVA STELLA... siamo noi due.'}]},
ch4_final_loss:{title:'LA FINALE · L\'ULTIMO GRADINO',lines:[
 {who:'kaito',text:'Avete dato tutto, ragazzi del molo. Stanotte ha vinto Shizuoka... ma per un soffio.'},
 {who:'rival',text:'...Quattro anni, {HERO}. Tra quattro anni torniamo e ce la riprendiamo.'},
 {who:'hero',text:'Quattro anni. E stavolta, il molo non si ferma sul più bello.'},
 {who:'captain-ita',text:'Testa alta, azzurri. Il mondo oggi ha conosciuto due ragazzi di Genova. E non li dimenticherà.'}]},

/* ── generic banks ── */
generic_pre:[
 [{who:'captain-club',text:'Testa nella partita, numero cento. Ogni punto pesa.'},{who:'hero',text:'Tre punti, capitano. Non uno di meno.'}],
 [{who:'gk-club',text:'Tu pensa a segnare di là. Di qua non passa niente: parola mia.'},{who:'hero',text:'Affare fatto. E la cena è ancora in palio.'}],
 [{who:'coach-club',text:'Semplice, veloce, cattivo. Tre parole, novanta minuti.'},{who:'hero',text:'Ricevuto, Mister.'}],
 [{who:'captain-club',text:'Oggi il loro capitano ha promesso di non farti toccare palla.'},{who:'hero',text:'Carino da parte sua. Io ho promesso tre gol.'}]],
generic_pre_ita:[
 [{who:'captain-ita',text:'Sessanta milioni di persone in quella maglia, ragazzo. Quando la indossi, sei tutti loro.'},{who:'hero',text:'Allora giochiamo per tutti, capitano.'}],
 [{who:'rival',text:'Il molo guarda, {HERO}. Facciamogli vedere chi siamo.'},{who:'hero',text:'Genova in mezzo al campo. Andiamo.'}]],
generic_post_win:[
 [{who:'captain-club',text:'Così. ESATTAMENTE così. Recupera, che tra tre giorni si rifà.'},{who:'hero',text:'Tra tre giorni rifacciamo meglio.'}]],
generic_post_loss:[
 [{who:'coach-club',text:'Si perde. Succede. Si impara. Quello che NON succede è perdere due volte di fila per lo stesso errore.'},{who:'hero',text:'Non succederà, Mister.'}]]
};
