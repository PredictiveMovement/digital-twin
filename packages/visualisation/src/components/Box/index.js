
import React from 'react';
import styled from 'styled-components'
import ProgressBar from '../ProgressBar';

const Wrapper = styled.div`
position: absolute;
top: 36px;
left: 36px;
display: flex;
flex-direction: column;
justify-content: space-space-between;
background-color: #10C57B;
padding: 1rem;
border-radius: 4px;
width: 338px;
height: 158px;
justify-content: space-between;
`


const Paragraph = styled.p`
margin: 0;
color: white;
`


const Box = () => {
    return (
        <Wrapper>
            <div>
                <Paragraph>Just nu kör 10 lastbilar i Ljusdal</Paragraph>
                <Paragraph>Co2: XXX</Paragraph>
                <Paragraph>Antal bokningar:</Paragraph>
                <Paragraph>Antal paket upphämtade från avlastningscentralen:</Paragraph>
            </div>
            <div>
                <Paragraph>Medel fyllnadsgrad per bil:</Paragraph>
                <ProgressBar completed={60} />
            </div>
        </Wrapper>
    )
}

export default Box;