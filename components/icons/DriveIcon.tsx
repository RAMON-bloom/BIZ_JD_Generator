
import React from 'react';

const DriveIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3h9l6 10.5-3 5.5h-15l-3-5.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3l6 10.5M13.5 13.5h6" />
    </svg>
);

export default DriveIcon;
