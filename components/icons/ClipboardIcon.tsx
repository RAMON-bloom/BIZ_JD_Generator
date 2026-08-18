
import React from 'react';

const ClipboardIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v3.75m-5.25 0V4.5A2.25 2.25 0 019 2.25h3c1.03 0 1.9.693 2.166 1.638m-7.332 0c.055.194.084.4.084.612v3.75m-5.25 0V4.5A2.25 2.25 0 019 2.25h3c1.03 0 1.9.693 2.166 1.638m0 0a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0118 21h-6a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25h.632z" />
    </svg>
);

export default ClipboardIcon;
