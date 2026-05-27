const EMPortalLogo = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 400 120" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
    >
        {/* Background Accent Shape (Optional: remove for transparent look) */}
        <rect x="10" y="20" width="140" height="80" rx="8" fill="#1e293b" />

        {/* EM - Bold & Impactful */}
        <text 
            x="80" 
            y="78" 
            fontFamily="Segoe UI, Roboto, Helvetica, sans-serif" 
            fontSize="54" 
            fontWeight="900" 
            fill="#ffffff" 
            textAnchor="middle"
            style={{ letterSpacing: '-2px' }}
        >
            EM
        </text>
        
        {/* P - The "Portal" highlight */}
        <text 
            x="165" 
            y="78" 
            fontFamily="Segoe UI, Roboto, Helvetica, sans-serif" 
            fontSize="54" 
            fontWeight="300" 
            fill="currentColor" 
            textAnchor="start"
            style={{ letterSpacing: '2px' }}
        >
            P
        </text>

        {/* Subtext: The Full Name */}
        <text 
            x="168" 
            y="100" 
            fontFamily="Segoe UI, sans-serif" 
            fontSize="14" 
            fontWeight="600" 
            fill="currentColor" 
            opacity="0.7"
            style={{ textTransform: 'uppercase', letterSpacing: '1.5px' }}
        >
            Employee Management Portal
        </text>
    </svg>
);

export default EMPortalLogo;