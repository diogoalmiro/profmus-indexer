const es = require('@elastic/elasticsearch')
const client = new es.Client({ node: process.env.ES_URL || 'http://localhost:9200' });
const fetch = require('./util/fetch')

const Index = module.exports.Index = "proftmus.0.0";
const Properties = {
    'Id': {
        type: 'keyword',
        normalizer: 'term_normalizer'
    }
};
let mapPropName = {};

(async () => {
    
    const {query: {allpages: proplist}} = await fetch.json("https://profmus.fcsh.unl.pt/static/wiki/api.php?action=query&format=json&prop=pageprops&list=allpages&apnamespace=122&aplimit=200")

    for(let i = 0; i < proplist.length; i+=50){
        const props = await fetch.json(`https://profmus.fcsh.unl.pt/static/wiki/api.php?action=query&format=json&prop=entityterms&titles=${proplist.slice(i, i+50).map(({title}) => title).join("|")}`);
        for( let o of Object.values(props.query.pages) ){
            mapPropName[o.title.split(":")[1]] = o.entityterms.label[0]
            Properties[o.entityterms.label[0]] = {
                type: 'text',
                fields: {
                    raw: {
                        type: "keyword"
                    },
                    keyword: {
                        type: "keyword",
                        normalizer: "term_normalizer"
                    }
                },
                fieldata: true
            }
        }
    }
    await module.exports.create().catch( e => {})

    let r = await fetch.json("https://profmus.fcsh.unl.pt/static/wiki/api.php?action=query&format=json&list=allpages&apnamespace=120&aplimit=500")
    do{
        for( let page of r.query.allpages){
            let title = page.title;
            let id = title.split(":")[1];
            let itemRev = await fetch.json(`https://profmus.fcsh.unl.pt/static/wiki/api.php?action=query&format=json&prop=revisions&titles=${title}&rvprop=content&rvslots=main`)
            let claims = JSON.parse(Object.values(itemRev.query.pages)[0].revisions[0].slots.main["*"]).claims;

            let obj = {
                Id: id
            }
            for(let key in claims){
                if( claims[key][0].mainsnak.datavalue.value.time ){
                    obj[mapPropName[key]] = claims[key][0].mainsnak.datavalue.value.time;
                }
                else{
                    obj[mapPropName[key]] = claims[key][0].mainsnak.datavalue.value;
                }
            }
            await client.index({
                index: module.exports.Index,
                document: obj
            })
        }
        r = await fetch.json(`https://profmus.fcsh.unl.pt/static/wiki/api.php?action=query&format=json&list=allpages&continue=-%7C%7C&apcontinue=${r.continue.apcontinue}&apnamespace=120&aplimit=500`)
    }
    while(r.continue.apcontinue);    
})().catch(console.log)


/*const Properties = module.exports.Properties = {
    "Original": {
        type: 'object',
        enabled: false
    },
    "Tipo": {
        type: 'keyword',
        normalizer: 'term_normalizer'
    },
    "Processo": {
        type: 'keyword',
        normalizer: 'term_normalizer'
    },
    "Data": {
        type: 'date',
        format: 'dd/MM/yyyy'
    },
    "Relator": {
        type: 'text',
        fields: {
            raw: {
                type: "keyword"
            },
            keyword: {
                type: "keyword",
                normalizer: 'term_normalizer'
            }
        }
    },
    "Descritores": {
        type: 'text',
        fielddata: true,
        fields: {
            raw: {
                type: "keyword"
            },
            keyword: {
                type: 'keyword',
                normalizer: 'term_normalizer'
            }
        }
    },
    "Meio Processual": {
        type: 'text',
        fielddata: true,
        fields: {
            raw: {
                type: "keyword"
            },
            keyword: {
                type: 'keyword',
                normalizer: 'term_normalizer'
            }
        }
    },
    "Votação": {
        type: 'object',
        properties: {
            "Forma": {
                type: 'text',
                fields: {
                    raw: {
                        type: "keyword"
                    },
                    keyword: {
                        type: 'keyword',
                        normalizer: 'term_normalizer'
                    }
                }
            },
            "Voto Vencido": {
                type: 'float'
            },
            "Declaração de Voto": {
                type: 'float'
            },
            "Voto de Desempate": {
                type: 'float'
            }
        }
    },
    "Secção": {
        type: 'text',
        fields: {
            raw: {
                type: "keyword"
            },
            keyword: {
                type: 'keyword',
                normalizer: 'term_normalizer'
            }
        }
    },
    "Decisão": {
        type: 'text',
        fields: {
            raw: {
                type: "keyword"
            },
            keyword: {
                type: 'keyword',
                normalizer: 'term_normalizer'
            }
        }
    },
    "Sumário": {
        type: 'text',
        term_vector: 'with_positions_offsets_payloads'
    },
    "Texto": {
        type: 'text',
        term_vector: 'with_positions_offsets_payloads'
    },
    "URL": {
        type: 'keyword',
    },
    "UUID": {
        type: 'keyword'
    },
    "HASH":{
        type: "object",
        properties: {
            "Original": { type: "keyword" },
            "Metadados": { type: "keyword" },
            "Texto": { type: "keyword" },
            "Sumário" : { type: "keyword" }
        }
    } 
}*/

module.exports.delete = () => client.indices.delete({ index: Index });
module.exports.exists = () => client.indices.exists({ index: Index });
module.exports.create = () => client.indices.create({
    index: Index,
    mappings: {
        properties: Properties
    },
    settings: {
        analysis: {
            normalizer: {
                term_normalizer: {
                    type: 'custom',
                    filter: ['lowercase', 'asciifolding']
                }
            }
        },
        number_of_shards: 1,
        number_of_replicas: 0,
        max_result_window: 550000
    }
});

/*if( require.main == module ){
    module.exports.exists().then( async exists => {
        if( !exists ){
            console.log("Creating index...", Index);
            await module.exports.create();
        }
        else{
            console.log("Index already exists", Index);
        }
    }).catch( err => {
        console.log( err );
    });
}*/