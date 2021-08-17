import React from 'react';
import styled from 'styled-components'

const Wrapper = styled.div`
position: absolute;
left: ${props => props.left - 50}px;
top: ${props => props.top - 115}px;
background-color: #10C57B;
width: 200px;
height: 60px;
padding: 1.1rem;
border-radius: 4px;
justify-content: space-between;
z-index: 1;

:after {
	z-index: -1;
	position: absolute;
    top: 98.1%;
    left: 43%;
    margin-left: -25%;
    content: '';
    width: 0;
    height: 0;
    border-top: solid 10px #10C57B;
    border-left: solid 10px transparent;
    border-right: solid 10px transparent;
}


`

const Paragraph = styled.p`
font-size: 14px;
margin: 0;
font-family: 'Roboto', sans-serif;
color: white;
`

const BookingInfoBox = ({ position, title, subTitle }) => {
    return (
        <Wrapper left={position.left} top={position.top}>
            <Paragraph>{title}</Paragraph>
            <Paragraph>{subTitle}</Paragraph>
        </Wrapper>
    )
}

export default BookingInfoBox;
