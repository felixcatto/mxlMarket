# Description

MVC app using  react + fastify + objection orm.

### Commands

*Development*
```
make database-build # only first time
make database-up 
make database-seed # for prepopulate database, only first time
make start
```

*Deploy*
```
git clone https://github.com/felixcatto/mxlMarket.git
cd mxlMarket
make compose-build
make compose-up
make compose-seed # for prepopulate database, only first time
```
then go to `http://localhost/`
