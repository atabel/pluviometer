//@flow
import cron from 'cron';
import harvestStations from './harvest-stations.mjs';
import log from './log.mjs';

const job = new cron.CronJob({
    cronTime: '00 00 12,00 * * *',
    onTick: harvestStations,
    start: false,
    timeZone: 'Europe/Madrid',
});

const startHarvestCron = () => {
    log('Starting cron job');
    job.start();
};

export default startHarvestCron;
