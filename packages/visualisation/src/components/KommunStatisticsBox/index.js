import React from 'react';
import styled from 'styled-components'
import ProgressBar from '../ProgressBar';
import { Paragraph } from '../Typography';

const Wrapper = styled.div`
position: absolute;
top: 36px;
left: 36px;
display: flex;
flex-direction: column;
justify-content: space-space-between;
background-color: #10C57B;
padding: 1.7rem;
border-radius: 4px;
height: 180px;
justify-content: space-between;
z-index: 1;
width: 250px;
`

const KommunStatisticsBox = ({ name, totalCars, totalBookings, totalCapacity, totalCo2, averageDeliveryTime, totalDelivered, averageUtilization, totalCargo, totalQueued, averageQueued }) => {

    return (
        !totalCars ? null :
        <Wrapper>
            <div>
                <Paragraph>{totalCars} fordon i {name}</Paragraph>
                <Paragraph>Total kapacitet: {totalCapacity} kollin</Paragraph>
                <Paragraph>Antal bokningar: {totalBookings} kollin</Paragraph>
                <Paragraph>Köat: {totalQueued} kollin</Paragraph>
                <Paragraph>Lastat: {totalCargo} kollin</Paragraph>
                {<Paragraph>CO2: {Math.round(totalCo2 * 10) / 10} kg</Paragraph>}
                <Paragraph>Levererade: {totalDelivered} kollin ({Math.round((totalDelivered / totalBookings) * 100)}%)</Paragraph>
                <Paragraph>Medel leveranstid: {Math.ceil(10 * averageDeliveryTime) / 10}h</Paragraph>

                {/* <Paragraph>Total cargo: {totalCargo}</Paragraph> */}
                {/* <Paragraph>Co2: XXX</Paragraph> */}
                {/* <Paragraph>Antal kollin upphämtade från avlastningscentralen: {bookingsFromHub} st</Paragraph> */}
            </div>
            {/* <div> */}
            <Paragraph thin>Medelfyllnadsgrad per bil:</Paragraph>
            {<ProgressBar completed={Math.round(averageUtilization * 100)} />}
            {/* </div> */}

        </Wrapper>
    )
}

export default KommunStatisticsBox;
