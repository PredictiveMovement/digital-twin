import * as React from 'react';

function InfoBox({ popUpInfo }) {
    return (
        <div>
            <pre>{JSON.stringify(popUpInfo, null, 2)}</pre>
        </div>
    );
}

export default React.memo(InfoBox);