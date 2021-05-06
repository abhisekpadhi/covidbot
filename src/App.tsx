import React from 'react';
import './App.css';
import {ChatController} from 'chat-ui-react';
import {MuiChat} from 'chat-ui-react';
import {Box, Button, Container} from '@material-ui/core';
import firebase from 'firebase/app';
import 'firebase/firestore';
import dayjs from 'dayjs';
import {captureLead, Lead, sendMsgToTeam} from './api';
import {cities, resources} from './constants';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ReplayIcon from '@material-ui/icons/Replay';

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
const ambulanceDb = store.collection('ambulance');
const bloodBankDb = store.collection('blood_bank');
const hospitalBedsDb = store.collection('hospital_beds');
const o2CylinderCentersDb = store.collection('o2_cylinder_centers');
const plasmaDonorsDb = store.collection('plasma_donor');


interface State {
    name: string;
    phone: string;
    address: string;
    details: string;
    city: string;
    msg: string;
    resources: {resType: string; data: { [field: string]: any }[]}[];
    offsets: {resType: string; offsetDoc: any, hasMore: boolean}[];
}

const initialState: State = {
    name: '',
    phone: '',
    address: '',
    details: '',
    city: '',
    msg:'',
    resources: [],
    offsets: [],
}

interface Props {
    chatCtl: ChatController;
}

class AppNewContent extends React.Component<Props, State> {
    readonly state: State = initialState;
    capturePersonalDetails = async () => {
        const chatCtl = this.props.chatCtl;
        // Chat content is displayed using ChatController
        // ask for name
        await chatCtl.addMessage({
            type: 'text',
            content: `Hello, What's your name.`,
            self: false,
        });
        const name = await chatCtl.setActionRequest({type: 'text'});
        this.setState({name: name.value});

        // ask for phone
        await chatCtl.addMessage({
            type: 'text',
            content: `Mobile no.`,
            self: false,
        });
        const phone = await chatCtl.setActionRequest({type: 'text'});
        this.setState({phone: phone.value});

        // ask for address
        await chatCtl.addMessage({
            type: 'text',
            content: `Address`,
            self: false,
        });
        const address = await chatCtl.setActionRequest({type: 'text'});
        this.setState({address: address.value}, () => {
            const req = {
                name: this.state.name,
                phone: this.state.phone,
                address: address.value
            } as Lead;
            captureLead(req)
                .then(r => {
                    if (r.status === 200) {
                        console.log('Lead captured')
                    } else {
                        console.log('Failed to capture lead.');
                    }
                })
                .catch(e => {
                    console.log(`Failed to capture lead. Error:${e}`);
                });
        });

        this.resourceAndCitySelectionFlow().then(_ => {});
    }

    resourceAndCitySelectionFlow = async () => {
        const chatCtl = this.props.chatCtl;

        // ask details
        await chatCtl.addMessage({
            type: 'text',
            content: `What are you searching for?`,
            self: false,
        });
        const details: any = await chatCtl.setActionRequest({
            type: 'select',
            options: resources,
        });
        this.setState({details: details.option.value});

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
        this.setState({city: city.option.value});

        this.findResources(details.option.value, city.option.value).then(_ => {});
    }

    findResources = async (resType: any, city: string) => {
        const chatCtl = this.props.chatCtl;

        // searching
        await chatCtl.addMessage({
            type: 'text',
            content: `Searching for ${resType} in ${city} city, Please wait...`,
            self: false,
        });

        await this.getResourceByCity(resType, city).then(_ => {});
    }

    getDb = (resType: string) => {
        switch (resType) {
            case 'hospital':
                return hospitalBedsDb;
            case 'oxygen_refill':
                return refillCentersDb;
            case 'oxygen_cylinder':
                return o2CylinderCentersDb;
            case 'ambulance':
                return ambulanceDb;
            case 'plasma':
                return plasmaDonorsDb;
            case 'blood_bank':
                return bloodBankDb;
            default:
                return hospitalBedsDb;
        }
    }

    doYouWannaContinue = async () => {
        const chatCtl = this.props.chatCtl;
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
                    value: 'contact',
                    text: 'Send message to our team',
                },
                {
                    value: 'no',
                    text: "I've found what I want",
                },
            ],
        });
        switch (details.option.value) {
            case 'yes':
                this.resourceAndCitySelectionFlow().then(_ => {});
                break;
            case 'no':
                await chatCtl.addMessage({
                    type: 'text',
                    content: (
                        <Box>
                            Thank you 🙏 for using our covid chat bot.
                            {'\n'}
                            Please share your feedback with us on social media.
                            {'\n'}
                            {socialMediaLinks.map(item => (
                                <a href={item}>{item}{'\n'}</a>
                            ))}
                        </Box>
                    ),
                    self: false,
                });
                break;
            case 'contact':
                await chatCtl.addMessage({
                    type: 'text',
                    content: `Enter your message`,
                    self: false,
                });
                const msg = await chatCtl.setActionRequest({type: 'text'});
                await this.sendMsg(msg.value)
                await this.doYouWannaContinue();
                break;
        }
    }

    readonly fetchLimit = 24;

    getResourceByCity = async (resType: string, city: string) => {
        const chatCtl = this.props.chatCtl;
        const idx = this.state.resources.findIndex(item => item.resType === resType)
        if (idx !== -1) {
            console.log(`state hit for ${this.state.details} in ${this.state.city} = ${JSON.stringify(this.state.resources[idx].data)}`);
            const res = this.state.resources[idx].data.filter(item => item.hasOwnProperty('city') && item['city'] === this.state.city)
            res.map(async item => {
                await chatCtl.addMessage({
                    type: 'text',
                    content: (
                        <Box>
                            {Object.keys(item).map(key => (
                                <Box>{key}: {item[key]}{'\n'}</Box>
                            ))}
                        </Box>
                    ),
                    self: false,
                });
            });
            this.doYouWannaContinue().then(_ => {});
        } else {
            await (this.getDb(resType))
                .where('city', '==', city)
                .limit(this.fetchLimit)
                .get()
                .then(async r => {
                    // Update offset
                    const off = {resType: resType, offsetDoc: r.docs[r.docs.length - 1], hasMore: true};
                    const updated = this.state.offsets;
                    updated.push(off);
                    this.setState({offsets: updated})
                    if (r.empty) {
                        chatCtl.addMessage({
                            type: 'text',
                            content: `Sorry! we couldn't find any resources.`,
                            self: false,
                        }).then(_ => {});
                        const offIdx = this.state.offsets.findIndex(item => item.resType = resType);
                        const offsets = this.state.offsets;
                        if (offIdx !== -1) {
                            offsets[offIdx].hasMore = false
                            this.setState({offsets});
                        } else {
                            const offsets = [...this.state.offsets, {resType: resType, offsetDoc: r.docs[r.docs.length -1], hasMore: false}];
                            this.setState({offsets});
                        }
                        this.setState({offsets: updated})
                    } else {
                        // Update state
                        const updated = this.state.resources;
                        const data: { [field: string]: any }[] = [];
                        r.forEach(doc => {
                            const record: {[k: string]: any} = {};
                            Object.keys(doc.data()).forEach(key => {
                                record[key] = doc.data()[key]
                            });
                            data.push(record);
                        });
                        updated.push({resType: resType, data});
                        this.setState({resources: updated});
                    }

                    // print data
                    r.forEach( doc => {
                        chatCtl.addMessage({
                            type: 'text',
                            content: (
                                <Box>
                                    {Object.keys(doc.data()).map(key => (
                                        <Box>{key}: {doc.data()[key]}{'\n'}</Box>
                                    ))}
                                </Box>
                            ),
                            self: false,
                        }).then(_ => {});
                    })

                    if (this.state.offsets.find(item => item.resType === resType)!.hasMore) {
                        const seeMore: any = await chatCtl.setActionRequest({
                            type: 'select',
                            options: [
                                {
                                    value: 'yes',
                                    text: 'See more',
                                },
                                {
                                    value: 'no',
                                    text: "I've found what I want",
                                },
                            ],
                        });

                        if (seeMore.option.value === 'yes') {
                            this.getResourcesByCityMore(resType, city).then(_ => {});
                        } else {
                            this.doYouWannaContinue().then(_ => {});
                        }
                    } else {
                        this.doYouWannaContinue().then(_ => {});
                    }
                })
        }
    }

    // Keep on fetching more data until exhaused
    getResourcesByCityMore = async (resType: string, city: string) => {
        const chatCtl = this.props.chatCtl;
        const offsetIdx = this.state.offsets.findIndex(item => item.resType === resType)
        if(offsetIdx !== -1){
            await (this.getDb(resType))
                .where('city', '==', city)
                .limit(this.fetchLimit)
                .startAfter(this.state.offsets[offsetIdx].offsetDoc)
                .get()
                .then(async r => {
                    // update offset
                    const idx = this.state.offsets.findIndex(item => item.resType === resType)
                    const updated = this.state.offsets;
                    updated[idx].offsetDoc = r.docs[r.docs.length - 1];
                    this.setState({offsets: updated});

                    if (r.empty) {
                        chatCtl.addMessage({
                            type: 'text',
                            content: `Sorry! we couldn't find any more resources.`,
                            self: false,
                        }).then(_ => {});
                        const offIdx = this.state.offsets.findIndex(item => item.resType = resType);
                        const offsets = this.state.offsets;
                        if (offIdx !== -1) {
                            offsets[offIdx].hasMore = false
                            this.setState({offsets});
                        } else {
                            const offsets = [...this.state.offsets, {resType: resType, offsetDoc: r.docs[r.docs.length -1], hasMore: false}];
                            this.setState({offsets});
                        }
                        this.setState({offsets: updated})

                    } else {
                        // update state
                        const updated = this.state.resources;
                        const existing = updated.findIndex(item => item.resType === resType)
                        if (existing !== -1) {
                            const data = updated[existing].data;
                            r.forEach(doc => {
                                const record: {[k: string]: any} = {};
                                Object.keys(doc.data()).forEach(key => {
                                    record[key] = doc.data()[key]
                                });
                                data.push(record);
                            });
                            updated[existing] = {...updated[existing], data};
                            this.setState({resources: updated});
                        } else {
                            const data: { [field: string]: any }[] = [];
                            r.forEach(doc => {
                                const record: {[k: string]: any} = {};
                                Object.keys(doc.data()).forEach(key => {
                                    record[key] = doc.data()[key]
                                });
                                data.push(record);
                            });
                            updated.push({resType, data});
                            this.setState({resources: updated});
                        }
                    }

                    // print data
                    r.forEach(  doc => {
                        chatCtl.addMessage({
                            type: 'text',
                            content: (
                                <Box>
                                    {Object.keys(doc.data()).map(key => (
                                        <Box>{key}: {doc.data()[key]}{'\n'}</Box>
                                    ))}
                                </Box>
                            ),
                            self: false,
                        }).then(_=>{});
                    });

                    if (this.state.offsets.find(item => item.resType === resType)!.hasMore) {
                        const seeMore: any = await chatCtl.setActionRequest({
                            type: 'select',
                            options: [
                                {
                                    value: 'yes',
                                    text: 'See more',
                                },
                                {
                                    value: 'no',
                                    text: "I've found what I want",
                                },
                            ],
                        });
                        if (seeMore.option.value === 'yes') {
                            this.getResourcesByCityMore(resType, city).then(_ => {});
                        } else {
                            this.doYouWannaContinue().then(_ => {});
                        }
                    } else {
                        this.doYouWannaContinue().then(_ => {});
                    }
            });
        } else {
            this.getResourceByCity(resType, city).then(_ => {})
        }
    }

    sendMsg = async (msg: string) => {
        const req = {
            username: 'Riya',
            avatar_url: '',
            content: `${dayjs().format('DD/MM/YYYY:hh:mm A')}`,
            embeds: [
                {
                    title: 'Message from user',
                    fields: [
                        {
                            name: 'Name',
                            value: this.state.name,
                        },
                        {
                            name: 'Phone',
                            value: this.state.phone,
                        },
                        {
                            name: 'Address',
                            value: this.state.address,
                        },
                        {
                            name: 'Message',
                            value: msg,
                        }
                    ]
                }
            ]
        };
        const r = await sendMsgToTeam(req);
            if (r) {
                if (r.status === 200 || 201 || 204) {
                    alert('We have received you message. Our team will get in touch with you soon.');
                } else {
                    alert('Sorry, failed to send message');
                }
            }
    }

    componentDidMount() {
        this.capturePersonalDetails().then(_ => {});
    }

    private scrlRef: React.RefObject<HTMLDivElement> = React.createRef();

    componentDidUpdate() {
        if (this.scrlRef.current) {
            this.scrlRef.current.scrollIntoView(false);
        }

    }

    render() {
        return (
            <Container>
                <Box display={'flex'} flex={1} flexDirection={'column'}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        variant="contained"
                        color="primary"
                        onClick={() => window.location.assign('https://odishacovid.com')}
                        style={{marginBottom: 20, marginTop: 20}}
                    >
                        Back to website
                    </Button>

                    <div>
                        <MuiChat chatController={this.props.chatCtl} />
                    </div>

                    <Button
                        startIcon={<ReplayIcon />}
                        variant="text"
                        color="default"
                        onClick={() => window.location.reload()}
                        style={{marginTop: 20, marginBottom: 20}}
                    >
                        Restart chat
                    </Button>

                    <div ref={this.scrlRef} />

                </Box>
            </Container>
        );
    }
}

const AppNew = (props: any) => {
    const [chatCtl] = React.useState(new ChatController());
    return (<AppNewContent {...props} chatCtl={chatCtl} />)
}

export default AppNew;
