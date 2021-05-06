import {DISCORD_WEBHOOK_URL_MSG_TO_TEAM, LEADS_API_URL} from './constants';

export const sendMsgToTeam = (request: object) => {
    if (DISCORD_WEBHOOK_URL_MSG_TO_TEAM) {
        return fetch(DISCORD_WEBHOOK_URL_MSG_TO_TEAM, {
            method: 'POST',
            body: JSON.stringify(request),
            headers: {'Content-Type': 'application/json'},
        });
    }
};

export interface Lead {
    name: string;
    phone: string;
    address: string;
}
export const captureLead = (request: Lead) => {
    return fetch(LEADS_API_URL, {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {'Content-Type': 'application/json'},
    });
}
