import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { Form, Container, Row, Col, Button, Modal } from 'react-bootstrap';
import './JoinGame.css';

let socket;

const JoinGame = () => {
    //const server = 'localhost:5000';
    //const server = 'http://192.168.10.240:5000'
    const server = ''
    const [roomName, setRoomName] = useState('');
    const [joinRoomName, setJoinRoomName] = useState('');
    const [masterName, setMasterName] = useState('');
    const [playerName, setPlayerName] = useState('');

    const [openRooms, setOpenRooms] = useState([]);
    const [show, setShow] = useState(false);
    const [openRoomName, setOpenRoomName] = useState('');
    const handleClose = () => setShow(false);
    const handleShow = (name) => {
        
        setShow(true);
        setOpenRoomName(name)
        setJoinRoomName(name)
    }

    useEffect(() => {
        socket = io.connect(server);

        socket.on('allRooms', (room) => {
            setOpenRooms(room.open)
        });
    }, [server]);

    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col>
                    <h1>Instructions</h1>
                    <ul>
                        <li>The game requires 1 game master and at least 2 players to start the game</li>
                        <li>A game master must first create a game room</li>
                        <li>Then players can join the game room by using the name</li>
                    </ul>
                </Col>
            </Row>
            <Row className="justify-content-md-center">
                <Col>
                    <h1>Create Game Room</h1>
                    <Form>
                        <Form.Control placeholder="Game room name" type="text" onChange={(event) => setRoomName(event.target.value)}/>
                        <Form.Control placeholder="Game Master name" type="text" onChange={(event) => setMasterName(event.target.value)}/>
                        <Link onClick={event => (!roomName) ? event.preventDefault() : null} to={`/gamemaster?roomName=${roomName}&masterName=${masterName}`}>
                            <Button variant="primary" type="submit">Create game</Button>
                        </Link>
                    </Form>
                </Col>
            </Row>

            <Row className="justify-content-md-center">
                <Col>
                    <h1>Join Game</h1>
                    <Form>
                        {
                            openRooms.length && openRooms.map((room) =>  <Button variant="secondary" onClick={() => handleShow(room)}>{room}</Button>)
                        }
                    </Form>
                </Col>
            </Row>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                <Modal.Title>Join room {openRoomName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form.Control placeholder="Player name" type="text" onChange={(event) => setPlayerName(event.target.value)}/>
                </Modal.Body>
                <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Link 
                    onClick={event => {
                        handleClose()
                        // if( (!joinRoomName) ){
                        // event.preventDefault() 
                        // } else {
                        //     handleClose()
                        // }
                    }} 
                    to={`/gameplayer?joinRoomName=${joinRoomName}&playerName=${playerName}`}
                >
                    <Button variant="primary" type="submit">Join game</Button>
                </Link>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default JoinGame;