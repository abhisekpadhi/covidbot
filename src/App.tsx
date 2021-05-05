import React, {useState} from 'react';// import logo from './logo.svg';
import './App.css';
import {ChatController} from 'chat-ui-react';
import {MuiChat} from 'chat-ui-react';
import {Box, Container} from '@material-ui/core';
import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const socialMediaLinks = [
    'https://www.instagram.com/covidresourcesodisha/',
    'https://twitter.com/OdishaResource',
    'https://www.facebook.com/Covid19ResourcesOdisha'
]

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);

const store = firebase.firestore(firebaseApp);

const refillCentersDb = store.collection('o2_refill_centers');


interface State {
    name: string;
    phone: string;
    address: string;
    details: string;
    city: string;
}

const initialState: State = {
    name: '',
    phone: '',
    address: '',
    details: '',
    city: '',
}

const cities = ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Rourkela']

function App(): React.ReactElement {
    const [chatCtl] = React.useState(new ChatController());
    const [state, setState] = useState<State>(initialState);

    const optionSelectionFlow = async () => {
        // ask details
        await chatCtl.addMessage({
            type: 'text',
            content: `What are you searching for?`,
            self: false,
        });
        const details: any = await chatCtl.setActionRequest({
            type: 'select',
            options: [
                // {
                //     value: 'hospital',
                //     text: '🏥 Hospital details',
                // },
                {
                    value: 'oxygen',
                    text: '💨 Oxygen details',
                },
                {
                    value: 'medicine',
                    text: '💊 Medicine details',
                },
                {
                    value: 'test',
                    text: '🔬 Covid test',
                },
                {
                    value: 'plasma',
                    text: '🩸 Plasma donation',
                },
            ],
        });
        setState(prevState => ({...prevState, details: details.option.vale}));

        // city
        await chatCtl.addMessage({
            type: 'text',
            content: `In which city?`,
            self: false,
        });
        const city: any = await chatCtl.setActionRequest({
            type: 'select',
            options: cities.map(item => ({value: item, text: item})),
        });
        setState(prevState => ({...prevState, city: city.option.vale}));

        findResources(details.option.value, city.option.value).then(_ => {});
    }

    const findResources = async (details: any, city: string) => {
        // searching
        await chatCtl.addMessage({
            type: 'text',
            content: `Searching for ${details} in ${city} city, Please wait...`,
            self: false,
        });

        switch (details) {
            case 'oxygen':
                await getO2RefillCentersByCity(city).then(r => {
                    if (r.empty) {
                        chatCtl.addMessage({
                            type: 'text',
                            content: `Sorry! we couldn't find any verified resources.`,
                            self: false,
                        }).then(_ => {});
                    }
                    r.forEach( async doc => {
                        console.log(`doc = ${JSON.stringify(doc.data())}`)
                        await chatCtl.addMessage({
                            type: 'text',
                            content: (
                                <Box>
                                    Center name: {doc.data()['center_name']}
                                    {'\n'}
                                    City: {doc.data()['city']}
                                    {'\n'}
                                    Phone: {doc.data()['phone']}
                                </Box>
                            ),
                            self: false,
                        });
                    })
                });
                doYouWannaContinue().then(_ => {});
                break;
            default:
                alert('Unsupported option!')
                break;
        }
    }

    const doYouWannaContinue = async () => {
        await chatCtl.addMessage({
            type: 'text',
            content: `Do you want to continue searching other resources?`,
            self: false,
        });
        const details: any = await chatCtl.setActionRequest({
            type: 'select',
            options: [
                {
                    value: 'yes',
                    text: 'Continue searching',
                },
                {
                    value: 'no',
                    text: "I've found what I want",
                },
            ],
        });
        if(details.option.value === 'yes') {
            optionSelectionFlow().then(_ => {});
        }
    }

    React.useMemo(async () => {
        // Chat content is displayed using ChatController
        // ask for name
        await chatCtl.addMessage({
            type: 'text',
            content: `Hello, What's your name.`,
            self: false,
        });
        const name = await chatCtl.setActionRequest({type: 'text'});
        setState(prevState => ({...prevState, name: name.value}));

        // ask for phone
        await chatCtl.addMessage({
            type: 'text',
            content: `Mobile no.`,
            self: false,
        });
        const phone = await chatCtl.setActionRequest({type: 'text'});
        setState(prevState => ({...prevState, phone: phone.value}));

        // ask for address
        await chatCtl.addMessage({
            type: 'text',
            content: `Address`,
            self: false,
        });
        const address = await chatCtl.setActionRequest({type: 'text'});
        setState(prevState => ({...prevState, address: address.value}));

        optionSelectionFlow().then(_ => {});

    }, [chatCtl]).then(_ => {});

    const getO2RefillCentersByCity = async (city: string) => {
        return await refillCentersDb.where('city', '==', city).get()
    }

    // Only one component used for  display
    return (
        <Container>
            <MuiChat chatController={chatCtl} />
        </Container>
    );
}

export default App;
