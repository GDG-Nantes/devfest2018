const fetch = require('node-fetch'),
	csv = require("fast-csv"),
    fs = require("fs"),
    download = require('image-downloader'),
	_ = require('lodash');

const SPEAKERS_JSON = "exports/speakers.json";
const SESSIONS_JSON = "exports/sessions.json";

const initialDatas = require('./devfest-json-accepted.json');

let formatsMap = {},
    categorieMap = {};

initialDatas.categories.forEach(cat => categorieMap[cat.id] = cat);
initialDatas.formats.forEach(format => formatsMap[format.id] = format);

extractJsons();

function extractJsons(){

    const speakers = initialDatas.speakers;
    const sessions = initialDatas.talks;


    const scheduleJson = [];
    const speakerJson = {};
    const sessionsJson = {};

    const sessionMap = {};
    sessions.forEach((session) => {
        sessionMap[session.id] = session;
    });

    const speakerMaps = {};
    speakers.forEach((speaker) => {
        if (speaker.displayName){
            const socials = [];
            if (speaker.twitter && speaker.twitter.length > 0) {
                socials.push({
                    icon: 'twitter',
                    name: 'Twitter',
                    link: speaker.twitter.indexOf('/') != -1 ? speaker.twitter : speaker.twitter.indexOf('@') != -1 ? `https://twitter.com/${speaker.twitter.substring(1, speaker.twitter.length - 1)}` : `https://twitter.com/${speaker.twitter}`
                });
            }
            if (speaker.googleplus && speaker.googleplus.length > 0){
                socials.push({
                    icon: 'gplus',
                    name: 'Google+',
                    link: speaker.googleplus.indexOf('/') != -1 ? speaker.googleplus : speaker.googleplus.indexOf('+') != -1 ? `https://google.com/${speaker.googleplus}` : `https://google.com/+${speaker.googleplus}`
                });
            }
            if (speaker.github && speaker.github.length > 0){
                socials.push({
                    icon: 'github',
                    name: 'Github',
                    link: speaker.github.indexOf('/') != -1 ? speaker.github : `https://github.com/${speaker.github}`
                });
            }
            if (speaker.social && speaker.social.length > 0){
                let socials = speaker.social.split(',');
                socials.forEach((social) => {
                    socials.push({
                        icon: 'website',
                        name: 'Website',
                        link: social
                    });
                });
            }


            let fileName = '';
            if (speaker.photoURL){
                const file_name_array = speaker.photoURL.split(".");
                let file_extension = file_name_array[file_name_array.length - 1];
                if (file_extension.toLowerCase() != 'jpg'
                && file_extension.toLowerCase() != 'jpeg'
                && file_extension.toLowerCase() != 'png'){
                    file_extension = 'jpg';
                }
                fileName = `images/speakers/${speaker.displayName.replace(' ', '_')}.${file_extension}`;
                if (!fs.existsSync(fileName)) {
                    try{

                        download.image({
                            url: speaker.photoURL,
                            dest: `exports/${fileName}`
                        })
                        .then(({ filename, image }) => {})
                        .catch((err) => {
                            console.log(`Erreur pendant la sauvegarde de l'image poru ${speaker.displayName} : ${speaker.photoURL}`);
                            console.log(err);
                        });
                    }catch(err){
                        console.log(`Erreur pendant la sauvegarde de l'image poru ${speaker.displayName} : ${speaker.photoURL}`);
                        console.log(err);
                    }
                }
            }else{
                console.log(`${speaker.displayName} n'a pas de photo`);
            }

            speakerJson[`${speaker.uid}`] = {
                id : speaker.uid,
                name : `${speaker.displayName}`,
                company : speaker.company,
                country: '',
                photoUrl: fileName,
                shortBio: speaker.bio ? speaker.bio.substring(0, speaker.bio.indexOf('.')) : '',
                bio: speaker.bio,
                tags: '',
                badges: [],
                socials: socials

            }
            speakerMaps[`${speaker.uid}`] = speaker;
        }
    });

    const dayMaps = {};

    sessions.forEach((session) => {


        const speakersArray = [];
        session.speakers.forEach((speakerUid) => {
            const speaker = speakerMaps[speakerUid.trim()];
            if (speaker){
                speakersArray.push(speaker.uid);
            }else if(speakerUid.trim().length > 0){
                console.log(`Problème de speaker avec la conf ${session.title} : ${session.speakers}`);
            }
        });

        const sessionTmp = sessionMap[session.id];

        const category = categorieMap[session.categories] ? categorieMap[session.categories].name : '';
        const format = formatsMap[session.formats] ? formatsMap[session.formats].name : ''
        sessionsJson[`${session.id}`] = {
            id: session.id,
            title: session.title,
            description: session.abstract,
            type: format,
            track: {title: ''},
            category: category,
            language: 'fr',
            tags: [category, format],
            complexity : sessionTmp.level,
            speakers : speakersArray
        };
    });


    addBreakSessions( sessionsJson);

    fs.writeFile(SPEAKERS_JSON, JSON.stringify(speakerJson, null, 4));
    fs.writeFile(SESSIONS_JSON, JSON.stringify(sessionsJson, null, 4));

}



function addBreakSessions(sessionsJson){

	// Day 1 Gates Opens
	sessionsJson["0"] = {
		"id": 0,
		"title": "Ouverture des portes / Gates open",
		"titleMobile": "Gates open",
		"image": "/images/backgrounds/opening.jpg",
		"type": "break"
	}

	// Day 1 Keynote
	sessionsJson["1"] = {
		"id": 1,
		"title": "Keynote d'ouverture / Opening keynote",
		"titleMobile": "Opening keynote",
		"image": "/images/backgrounds/keynote.jpg",
		"type": "keynote"
	}

	// Day 1 Lunch
	sessionsJson["2"] = {
		"id": 2,
		"title": "Déjeuner / Lunch",
		"titleMobile": "Lunch",
		"description": "Foooooood !!!",
		"image": "/images/backgrounds/lunch.jpg",
		"type": "break"
	}

	// Day 1 After
	sessionsJson["3"] = {
		"id": 3,
		"title": "After Party",
		"description": "Cette année l’After Party est organisé par notre partenaires U GIE IRIS (Système U). <br />Elle aura lieu sur place à la Cité des Congrès (dans la Grande Galerie) à partir de 18h30 le Jeudi 19 Octobre. <br />Retrouvons-nous autour d'un apéro pour discuter des événements de la 1ère journée et faire du networking. A l'affiche, des démos, des découvertes, de la musique...<br />Venez nombreux !!",
		"image": "/images/backgrounds/party.jpg",
		"type": "break"
	}


	// Day 2 Gates Opens
	sessionsJson["4"] = {
		"id": 4,
		"title": "Ouverture des portes / Gates open",
		"titleMobile": "Gates open",
		"image": "/images/backgrounds/opening.jpg",
		"type": "break"
	}


	// Day 2 Lunch
	sessionsJson["5"] = {
		"id": 5,
		"title": "Déjeuner / Lunch",
		"titleMobile": "Lunch",
		"description": "Foooooood !!!",
		"image": "/images/backgrounds/lunch.jpg",
		"type": "break"
	}


}
