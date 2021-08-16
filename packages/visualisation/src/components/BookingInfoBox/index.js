import React from 'react';
import styled from 'styled-components'

const Wrapper = styled.div`
position: absolute;
left: ${props => props.left - 50}px;
top: ${props => props.top - 90}px;
background-color: #10C57B;
width: 200px;
padding: 1.2rem;
border-radius: 4px;
justify-content: space-between;
z-index: 1;
`

const Paragraph = styled.p`
margin: 0;
font-family: 'Roboto', sans-serif;
color: white;
`

const BookingInfoBox = ({ position, title, isCommercial }) => {
    return (
        <Wrapper left={position.left} top={position.top}>
            <Paragraph>{title}</Paragraph>
            <Paragraph>{isCommercial}</Paragraph>
        </Wrapper>
    )
}

export default BookingInfoBox;
