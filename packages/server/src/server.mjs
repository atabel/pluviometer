// @flow
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import graphql from 'express-graphql';
import schema from './graphql-schema.mjs';
import startHarvestCron from './harvest-cron.mjs';
import log from './log.mjs';

const PORT = 5000;
const app = express();

app.use(cors());
app.use(
    '/graphql',
    graphql({
        schema,
        graphiql: true,
    })
);

app.listen(PORT, () => {
    log('Server listening on port', PORT);
});

startHarvestCron();
