/**
 * LogLine component.
 * @param {string} header - The header of the log.
 * @param {object|string} value - The value of the log.
 * @returns {React.ReactNode} - The LogLine component.
 */
export default function LogLine({ header, value }) {
    return ( <div className="flex flex-col mb-2"> <h6 className="font-mono text-sm text-gray-400">
        {header}</h6> 
            <p className="font-mono text-md text-dark pl-2">
            {
                typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : value
            }
            </p>

    </div> ); 
}