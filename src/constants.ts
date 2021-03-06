export const SUBNUB_ENV = process.env['REACT_APP_SUBNUB_ENV'] || 'local';

export const getApiUrl = () => {
    if(SUBNUB_ENV === 'prod') {
        return {
            leads: 'https://post-svc.subnub.com/odishacovid/v1/leads'
        }
    } else {
        return {
            leads: 'http://localhost:8010/odishacovid/v1/leads'
        }
    }
};

export const DISCORD_WEBHOOK_URL_MSG_TO_TEAM = process.env['REACT_APP_DISCORD_WEBHOOK_URL_MSG_TO_TEAM'];
export const LEADS_API_URL = getApiUrl().leads;

export const cities = [
    'Bhubaneswar',
    'Cuttack',
    'Berhampur',
    'Angul',
    'Dhenkanal',
    'Titlagarh',
    'Bargarh',
    'Rayagada',
    'Bhawanipatna',
    'Talcher',
    'Jharsuguda',
    'Nayagarh',
    'Balugaon',
    'Brahmapur',
    'Brajarajnagar',
    'Chandipur',
    'Sambalpur',
    'Puri',
    'Balasore',
    'Bhadrak',
    'Baripada',
    'Rourkela',
    'Pipili',
    'Barbil',
    'Jatani',
    'Hirakud',
    'Phulabani'
];

export const resources =  [
    {
        value: 'hospital',
        text: 'π₯ Hospital details',
    },
    {
        value: 'oxygen_refill',
        text: 'π Oxygen details',
    },
    {
        value: 'oxygen_cylinder',
        text: 'β½οΈ Oxygen cylinders',
    },
    {
        value: 'ambulance',
        text: 'π Ambulance',
    },
    {
        value: 'plasma',
        text: 'π Plasma donation',
    },
    {
        value: 'blood_bank',
        text: 'π©Έπ¦ Blood bank',
    },
];
