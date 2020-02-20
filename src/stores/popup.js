import { phone, country } from './input';
import { writable } from 'svelte/store';
import countrylist from './countries.json';

const createCountries = () => {
    const { subscribe, set, update } = writable(countrylist);
    phone.subscribe(async phone => {
        const phonecheck = phone.replace(/\D/g, '').slice(0,3);
        if (phonecheck) {
            update(() => countrylist.filter(country => {
                if (country.code) {
                    return phonecheck.includes(country.code);      
                }
            }));
        } else {
            set(countrylist);
        }
    });
    country.subscribe(async country => {
        if (country) {
            update(() => countrylist.filter((cntry) => {
                return cntry.name.toLowerCase().includes(country.toLowerCase());
            }));
        } else {
            set(countrylist);
        }
    })

    return { subscribe }
}

export const countries = createCountries();