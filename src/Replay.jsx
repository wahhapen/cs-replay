import React, { useEffect, useState } from 'react'
import 'normalize.css'
import './App.css'
import { Stage, Container, Sprite } from '@inlet/react-pixi'
import PlayersScene from './PlayersScene'

const OFFSET_X = 1099.0767045454545;
const OFFSET_Y = 1437.7663352272725;
const SCALE = 2.2528;
const RESOLUTION = 2000;

const transformX = (x) => x / SCALE + OFFSET_X;
const transformY = (y) => (y * -1) / SCALE + OFFSET_Y;

const map = './de_dust2.png';

const Replay = () => {
    const [gameData, setGameData] = useState({});
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [winnerBanner, setWinnerBanner] = useState(0);

    useEffect(() => {
        fetch('./data.json')
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                const {
                    PlayersPositions,
                    Players,
                    RoundEndState,
                    RoundStartState,
                } = data;


                const importantData = {};
                importantData.players = Players.map((player) => {
                    const playerPositions = PlayersPositions.find(
                        (positionObj) =>
                            positionObj.PlayerID === player.PlayerID
                    );
                    return {
                        id: player.PlayerID,
                        team: player.Team,
                        positions: {
                            x: playerPositions.X.map((x) => transformX(x)),
                            y: playerPositions.Y.map((y) => transformY(y)),
                        },
                    };
                });
                importantData.roundLastKillTime = PlayersPositions[PlayersPositions.length - 2].X.length // YEP dirty hack
                importantData.roundTotalTime = RoundEndState.FrameNumber - RoundStartState.FrameNumber

                setGameData(importantData);
                setLoading(false);
            })
            .catch((err) => {
                console.log('Error Reading data ' + err)
            });
    }, []);

    const handleStartRound = () => {
        setPlaying(true);
        setWinnerBanner(0);
    };
    const handleFinishRound = () => {
        setPlaying(false);
    };
    const handleWin = (team) => {
        setWinnerBanner(team);
    };
    const renderWinnerBanner = () => (
        <div className="Winner">
            {winnerBanner === 2 ? 'Terrorists Win' : 'Counter-Terrorists Win'}
        </div>
    );

    return (
        <div className="App">
            {winnerBanner !== 0 && renderWinnerBanner()}
            <button
                className={`Watch ${playing && 'hidden'}`}
                type="button"
                onClick={handleStartRound}
            >
                Watch
            </button>
            <Stage
                width={RESOLUTION}
                height={RESOLUTION}
                options={{ backgroundColor: 0x012b30 }}
            >
                <Sprite image={map} />
                <Container width={RESOLUTION} height={RESOLUTION}>
                    {!loading && playing && (
                        <PlayersScene
                            players={gameData.players}
                            roundTotalTime={gameData.roundTotalTime}
                            roundLastKillTime={gameData.roundLastKillTime}
                            onWin={handleWin}
                            onFinish={handleFinishRound}
                        />
                    )}
                </Container>
            </Stage>
        </div>
    )
}

export default Replay
