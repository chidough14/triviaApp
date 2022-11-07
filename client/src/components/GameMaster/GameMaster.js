import React, { useEffect, useState } from 'react';
import queryString from 'query-string';
import { Button, Container } from 'react-bootstrap';
import io from 'socket.io-client';
import Messages from '../Messages/Messages';
import './GameMaster.css';
import icon from '../../download.png';

let socket; // let can be declared without a value, const can not

const GameMaster = (props) => {
    //const server = 'localhost:5000';
    // const server = 'http://192.168.10.240:5000'
    const server = ''
    const [roomName, setRoomName] = useState('');
    const [masterName, setMasterName] = useState('');
    const [serverResMsg, setServerResMsg] = useState({res: 'When at least 2 players are in the room, click Start Game'});
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [playerThatAnswered, setPlayerThatAnswered] = useState([]);

    const [questions, setQuestions] = useState([]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [round, setRound] = useState(0);

    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    const [playersInRoom, setPlayersInRoom] = useState([]);
    const [playerCount, setPlayerCount] = useState([]);

    const [gameStarted, setGameStarted] = useState([]);
    const [gameEnded, setGameEnded] = useState([]);

    useEffect(() => {
        const { roomName, masterName } = queryString.parse(props.location.search);
        socket = io.connect(server);
        setRoomName(roomName);
        setMasterName(masterName);
        
        socket.emit('createRoom', { roomName, masterName }, (error) => {
            if (error) {
                setError(true);
                setErrorMsg(error);
                console.log(error);
            };
        });

        socket.on('playerData', (allPlayersInRoom) => {
            setPlayersInRoom(allPlayersInRoom);
            setPlayerCount(allPlayersInRoom.length);
        });

        return () => {
            socket.emit('disconnect');
            socket.disconnect();
        };
    }, [server, props.location.search]);

    useEffect(() => {
        socket.on('message', (text) => {
            setMessage(text);
        });

        socket.on('message', (message) => {
            setMessages([...messages, message ]);
        });
    }, [messages]);

    const InitGame = () => {
        setPlayerThatAnswered([])

        socket.emit('ready', (res) => {
            setServerResMsg(res);
            setGameStarted(true);
            setGameEnded(false);
        });
    };

    useEffect(() => {
        socket.on('initGame', () => {
            setRound(0);
            const response = fetch(`https://opentdb.com/api.php?amount=4&type=multiple&encode=url3986`)
                .then(response => response.json())
                .then(res => {
                    setQuestions(res.results);
                    sendQuestion(res.results);
            });
        });
    }, []);

    const sendQuestion = (questionObj) => {
        const gameQuestion = questionObj[round].question;
        const incorrectOptions = questionObj[round].incorrect_answers;
        const correctOption = questionObj[round].correct_answer;
        
        const gameOptionsArray = [...incorrectOptions];
        const randomNumber = Math.random() * 3;
        const position = Math.floor(randomNumber) + 1;
        gameOptionsArray.splice(position -1, 0, correctOption); // startpos: 0, delete 0, add
        setCorrectAnswer(correctOption);

        setRound(prevRound => {return prevRound + 1}); // setRound for next render, prevRound: holds the round number

        const gameRound = round + 1;
        socket.emit('showQuestion', { gameQuestion, gameOptionsArray, gameRound });
    };

    const NextQuestion = () => {
        if (round !== questions.length) {
            sendQuestion(questions);
        } else {
            socket.emit('endGame');
            setServerResMsg({ res: 'The game has ended! You can play again if there are enough players.' });
            setGameEnded(true);
        };

        setPlayerThatAnswered([])
    };
    
    useEffect(() => {
        socket.on('playerChoice', (playerName, playerChoice, gameRound) => {
            if (gameRound === round) {
                if (playerChoice === decodeURIComponent(correctAnswer)) {
                    console.log(playerName, 'has answered CORRECTLY:', playerChoice);
                    socket.emit('updateScore', playerName);
                };
                socket.emit('correctAnswer', correctAnswer, playerName);
            };
            setServerResMsg({ res: 'When all players have answered, click Next question' });
        });

        socket.on('showAnsweredStautus', (playerName, gameRound) => {
            if (gameRound === round) {
              setPlayerThatAnswered(prev => [...prev, playerName])
            };
           // setServerResMsg({ res: 'When all players have answered, click Next question' });
        });
    }, [round]);

    return (
        <Container>
            <div className="wrapper">
                {error === true ? (
                    <div className="errorMsg">
                        <p>{errorMsg.error}</p>
                        <a href="/">Go back</a>
                    </div>
                ) : (
                    <div>
                        <h2>Hello, Game Master {masterName}!</h2>
                        <div className="serverRes">
                            <strong>{serverResMsg.res}</strong>
                        </div>

                        {
                            playerThatAnswered.length && playersInRoom.length && (playerThatAnswered.length === playersInRoom.length)&& 

                            <span style={{color: "red"}}>All players have answered !!</span>
                        }
                        <div className="button-container">                            
                        
                        {gameStarted === true ? (
                            <div>
                                {gameEnded === true ? (
                                    <div>
                                        {playerCount >= 2 ? (    
                                                <Button variant="primary" size="md" onClick={InitGame}>Play Again</Button>
                                            ) : (
                                                <Button variant="primary" disabled size="md" onClick={InitGame}>Play Again</Button>
                                            )
                                        }
                                    </div>
                                    ) : (
                                        <Button variant="primary" size="md" onClick={NextQuestion}>Next question</Button>
                                    )
                                }
                            </div>
                            ) : (
                                <div>
                                    {playerCount >= 2 ? (
                                            <Button variant="primary" size="md" onClick={InitGame}>Start Game</Button>
                                        ) : (
                                            <Button variant="primary" disabled size="md" onClick={InitGame}>Start Game</Button>
                                        )
                                    }
                                </div>
                            )
                        }

                        </div>
                        <div className="players-container">
                            <h3>Players in room: {playerCount}</h3>
                            <hr/>
                            {playersInRoom.map((playerInfo, index) =>
                                <p className="p-players" key={index}>
                                    Playername: {playerInfo.username}

                                    {playerThatAnswered.includes(playerInfo.username) ? 
                                    <img src={icon} style={{width: "18px"}}  />: 
                                    null}
                                </p>
                            )}
                        </div>
                        <div className="messages-container">
                            <h3>Activity</h3>
                            <hr/>
                            <Messages messages={messages}/>
                        </div>
                        <a href="/">Leave room</a>
                    </div>
                )}
            </div>
        </Container>
    );
};

export default GameMaster;