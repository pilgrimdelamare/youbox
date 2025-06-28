# YouBox

Sistema gara musicale multi-brano:
- **Brani:** File video in `backend/songs/` (`AUTORE - TITOLO.mp4`)
- **Scene di servizio:** In `backend/scenes/` (`standby.mp4`, `start.mp4`, ecc.)
- **Concorrenti e voti:** gestiti via file JSON (nessun database)
- **Flusso gara:** Estrazione brano → overlay con autore/titolo → riproduzione video → voto pubblico → pitch detection
- **Dashboard, monitor, voting:** su porte 3001, 3002, 3003

## Avvio rapido

1. Installa tutto:
   ```
   npm run install-all
   ```
2. Avvia in 4 terminali:
   ```
   npm run start-backend
   npm run start-dashboard
   npm run start-monitor
   npm run start-voting
   ```
3. Metti i video brano in `backend/songs/` (es: `MINA - Se telefonando.mp4`)
4. Metti le scene in `backend/scenes/` (`standby.mp4`, ecc.)
5. Dashboard: [http://localhost:3001](http://localhost:3001)
6. Monitor: [http://localhost:3002](http://localhost:3002)
7. Voting:  [http://localhost:3003](http://localhost:3003)