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
padding: 1.2rem;
border-radius: 4px;
height: 158px;
justify-content: space-between;
z-index: 1;
`

const Paragraph = styled.p`
margin: 0;
font-family: 'Roboto', sans-serif;
font-weight: ${(props) => props.thin ? 300 : 400};
color: white;
`

const KommunStatisticsBox = ({ name, totalCars, totalBookings, totalCapacity, bookingsFromHub, totalCargo }) => {
    return (
        <Wrapper>
            <div>
                <Paragraph>Just nu kör {totalCars} lastbilar i {name}</Paragraph>
                <Paragraph>Total kapacitet: {totalCapacity}</Paragraph>
                <Paragraph>Total cargo: {totalCargo}</Paragraph>
                <Paragraph>Antal bokningar: {totalBookings} st</Paragraph>
                <Paragraph>Co2: XXX</Paragraph>
                <Paragraph>Antal paket upphämtade från avlastningscentralen: {bookingsFromHub} st</Paragraph>
            </div>
            <div>
                <Paragraph thin>Medelfyllnadsgrad per bil:</Paragraph>
                <ProgressBar completed={60 /* totalCapacity / totalCargo or so */} />
            </div>
        </Wrapper>
    )
}

export default KommunStatisticsBox;
