import React, { useState } from 'react';
import styled from 'styled-components'
import { Paragraph } from '../Typography';
import checkMark from '../../icons/checkmark.svg'

const Wrapper = styled.div`
position: absolute;
top: 45%;
right: 45%;
background-color: #10c57b;
padding: 2.3rem 2rem;
height: 100px;
width: 241px;
border-radius: 2px;
`

const StyledButton = styled.button`
margin-top: 1rem;
width: 160px;
height: 32px;
background-color:  white;
border: none;
cursor: pointer;
font-size: 14px;
color: #10C57B;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
border-radius: 2px;
`

const Box = styled.div`
width: 241;
display: flex;
justify-content: center;
`

const Line = styled.hr`
border-top: 1px;
`

const SquareButton = styled.button`
width: 16px;
height: 16px;
border: 1px solid white;
cursor: pointer;
background-color: ${(props) => props.inverted ? 'white' : '#10c57b;'};
`

const Flex = styled.div`
display: flex;
justify-content: space-between;
width: 100%;
`

const CheckMarkImg = <img style={{ marginLeft: '-6px' }} src={checkMark} alt='Check mark' />


const Popup = ({ setShowArcLayer, setShowQueuedBookings, setShowPopup, showArcLayer, showQueuedBookings }) => {

    return (
        <Wrapper>
            <Flex>
                <Paragraph>Kommande bokningar</Paragraph>
                <SquareButton inverted={showArcLayer} onClick={() => setShowArcLayer(current => !current)}> {showArcLayer && CheckMarkImg}</SquareButton>
            </Flex>
            <Line />
            <Flex>
                <Paragraph>Köande bokningar</Paragraph>
                <SquareButton inverted={showQueuedBookings} onClick={() => setShowQueuedBookings(current => !current)}>{showQueuedBookings && CheckMarkImg}</SquareButton>
            </Flex>
            <Line />
            <Box>
                <StyledButton onClick={() => {
                    setShowPopup(false)
                }}>Stäng</StyledButton>
            </Box>
        </Wrapper>
    )
}

export default Popup;
