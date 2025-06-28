new Vue({
    el: '#app',
    data: {
        scenes: [],
        currentScene: 'start',
        contestants: [],
        newContestant: '',
        activeContestantId: null,
        drawnSong: null,
        socket: null,
        // NUOVI DATI
        tables: [],
        publicScore: 0,
        aiScore: 0,
        publicScoreOverride: null,
        aiScoreOverride: null,
        selectedTableId: '',
        pointsToAdjust: null,
    },
    computed: {
        activeContestant() {
            return this.contestants.find(c => c.id === this.activeContestantId);
        },
        // NUOVO: computed property per ordinare i tavoli
        sortedTables() {
            return [...this.tables].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        }
    },
    methods: {
        connect() {
            this.socket = io('http://localhost:4000');
            this.socket.on('update', (gameState) => {
                this.scenes = gameState.scenes;
                this.currentScene = gameState.scene;
                this.contestants = gameState.contestants;
                this.activeContestantId = gameState.activeContestantId;
                this.drawnSong = gameState.drawnSong;
                // NUOVO: aggiornamento dati aggiuntivi
                this.tables = gameState.tables;
                this.publicScore = gameState.publicScore;
                this.aiScore = gameState.aiScore;
            });
        },
        setScene(sceneId) {
            this.socket.emit('setScene', sceneId);
        },
        nextScene() {
            const currentIndex = this.scenes.findIndex(s => s.id === this.currentScene);
            const nextIndex = (currentIndex + 1) % this.scenes.length;
            this.socket.emit('setScene', this.scenes[nextIndex].id);
        },
        addContestant() {
            if (this.newContestant.trim()) {
                this.socket.emit('addContestant', this.newContestant.trim());
                this.newContestant = '';
            }
        },
        deleteContestant(id) {
            this.socket.emit('deleteContestant', id);
        },
        setActiveContestant(id) {
            this.socket.emit('setActiveContestant', id);
        },
        moveContestant(index, direction) {
            this.socket.emit('moveContestant', { index, direction });
        },
        drawSong() {
            this.socket.emit('drawSong');
        },
        // NUOVI METODI
        forceScore(type) {
            const value = type === 'public' ? this.publicScoreOverride : this.aiScoreOverride;
            if (value !== null && !isNaN(value)) {
                this.socket.emit('forceScore', { type, value });
                if (type === 'public') this.publicScoreOverride = null;
                else this.aiScoreOverride = null;
            }
        },
        adjustTablePoints() {
            if (this.selectedTableId && this.pointsToAdjust !== null && !isNaN(this.pointsToAdjust)) {
                this.socket.emit('adjustTablePoints', {
                    tableId: this.selectedTableId,
                    points: this.pointsToAdjust
                });
                this.pointsToAdjust = null;
            }
        }
    },
    created() {
        this.connect();
    }
});
