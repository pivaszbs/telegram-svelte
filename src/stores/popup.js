import { phone, country } from './input';
import { derived } from 'svelte/store';
import countrylist from './countries.json';

let setted;

export const countries = derived([phone, country], ([ph, cn]) => {
    const phcheck = ph.replace(/\D/g, '').slice(0,3);
    const newCountries = countrylist.filter(cntry => {
        if (phcheck) {
            if (cntry.code) {
                return cntry.code.match(phcheck) && cntry.name.toLowerCase().includes(cn.toLowerCase()) || phcheck.includes(cntry.code);      
            } 

            return false;
        }

        return cntry.name.toLowerCase().includes(cn.toLowerCase());
    });
    
    if (newCountries.length === 1 && setted !== newCountries[0].code) {
        setted = newCountries[0].code;
        country.set(newCountries[0].name);
        if (ph.length < newCountries[0].code.length) {
            phone.set(newCountries[0].code);
        }
    } else if (newCountries.length > 1) {
        setted = void '';
    }

    return newCountries;
});
