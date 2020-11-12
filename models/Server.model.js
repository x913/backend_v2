const pool = require('../helpers/mysql_connect');
const crypto = require('crypto');
const createError = require('http-errors');

function Server() {}

function buildCountriesResponse(results) {
    if (!results || results.length === 0)
        return;

    let objects = [];
    for (let result of results) {
        let current = objects.find(x => x.country === result.country);
        let currentServer = {
            ip: result.ip,
            protocol: result.protocol,
            port: result.port,
        };
        if (!current) {
            objects.push({
                country: result.country,
                is_fastest: result.is_fastest,
                iso3166_2: result.country2,
                is_premium: result.is_premium,
                flag: `/static/flags/${result.country2.toLowerCase()}.jpg`,
                servers: [currentServer]
            });
        } else
            current.servers.push(currentServer)
    }
    return objects;

}

Server.prototype.getFastest = async function(continent) {

    try {
        this.connection = await pool.getConnection();

        let results;

        if(continent) {

            [results] = await this.connection.query(
                `select
                    v.country, v.country2, v.is_premium, vs.protocol, vs.port, vs.ip, 1 is_fastest
                from
                    vpn_countries v
                join vpn_servers vs
                    on v.id = vs.country_id
                where
                    v.continent = ?
                and
                    vs.active = 1                            
                and
                    is_premium = 0
                order by
                    v.country`, [continent]);

            let countriesResponse = buildCountriesResponse(results);
            if (countriesResponse)
                return countriesResponse;
        }

        // no results by continent or no continent - select all active and not premium
        [results] = await this.connection.query(
            `select
                v.country, v.country2, v.is_premium, vs.protocol, vs.port, vs.ip, 1 is_fastest
            from
                vpn_countries v
            join vpn_servers vs
                on v.id = vs.country_id
            where
                vs.active = 1
            and
                is_premium = 0
            order by
                v.country`);

        countriesResponse = buildCountriesResponse(results);
        if(countriesResponse)
            return countriesResponse;


    } catch(error) {
        throw error;
    } finally {
        if(this.connection)
            this.connection.release();
    }

}
 
Server.prototype.getAll = async function(continent) {
    try {
        this.connection = await pool.getConnection();

        let [results] = await this.connection.query(
            `select
                v.country, v.country2, 
                v.is_premium, vs.protocol, vs.port, vs.ip,
                case when v.continent = ? and v.is_premium = 0 then 1 else 0 end as is_fastest
            from
                treevpn.vpn_servers vs
            join
                vpn_countries v on vs.country_id = v.id
            where
                vs.active = 1
            order by
                v.country`, [continent]
        );
        
        let retVal = buildCountriesResponse(results);
        return retVal;
    } catch(error) {
        throw error;
    } finally {
        if(this.connection)
            this.connection.release();
    }
}

module.exports = Server;