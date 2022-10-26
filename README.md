# Passos

  - Clonar este repositório
  - Ter acesso a uma instancia de elasticsearch (para usar a já existente remota correr `ssh user@host -L 9200:localhost:9200` num terminal à parte)
  - Instalar dependencias `npm i`
  - Indexar a wikimedia `node proftmus.js` (Se o recurso já existir, este passo dá erro, mas pode ser ignorado)
  - Correr a interface (entrar no diretório `server/` e correr `node server.js` )

## Environment Variables
 - `ES_URL`: Elasticsearch url, defaults to `http://localhost:9200`

## Indexar wikimedia

Para indexar a wikimedia usou-se a API que estas disponibiliza (Uma UI para a testarem (profmus.fcsh.unl.pt/static/wiki/index.php/Especial:ApiSandbox)[https://profmus.fcsh.unl.pt/static/wiki/index.php/Especial:ApiSandbox])

 - Listar propriedades: https://profmus.fcsh.unl.pt/static/wiki/api.php?action=query&format=json&prop=pageprops&list=allpages&apnamespace=122&aplimit=200
 - Receber o Nome das propriedades (até 50 de cada vez): https://profmus.fcsh.unl.pt/static/wiki/api.php?action=query&format=json&prop=entityterms&titles=PROP1|PROP2
 - Listar items (até 500 de cada vez): https://profmus.fcsh.unl.pt/static/wiki/api.php?action=query&format=json&list=allpages&apnamespace=120&aplimit=500
 - Obter a revisão de um item (para guardar os valores): https://profmus.fcsh.unl.pt/static/wiki/api.php?action=query&format=json&prop=revisions&rvprop=content&rvslots=main&titles=ITEM1