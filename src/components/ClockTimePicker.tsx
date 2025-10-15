import { useState } from 'react'

type ClockTimePickerProps = {
  value: string
  onChange: (time: string) => void
  disabled?: boolean
}

const ClockTimePicker = ({ value, onChange, disabled = false }: ClockTimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [hour, setHour] = useState(value ? parseInt(value.split(':')[0]) : 12)
  const [minute, setMinute] = useState(value ? parseInt(value.split(':')[1]) : 0)
  const [period, setPeriod] = useState(value && parseInt(value.split(':')[0]) < 12 ? 'AM' : 'PM')

  const handleConfirm = () => {
    const displayHour = period === 'AM' ? (hour === 12 ? 12 : hour) : (hour === 12 ? 12 : hour + 12)
    const timeString = `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    onChange(timeString)
    setIsOpen(false)
  }

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHour(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
  }

  const displayValue = value || 'Select time'

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
      >
        {displayValue}
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 z-50 rounded-lg border border-slate-300 bg-white p-4 shadow-lg">
          <div className="flex flex-col gap-4">
            {/* Clock Visual */}
            <div className="flex flex-col items-center">
              <div className="relative h-64 w-64 rounded-full border-4 border-slate-300 bg-slate-50">
                {/* Hour markers */}
                {[...Array(12)].map((_, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180)
                  const x = 128 + 100 * Math.cos(angle)
                  const y = 128 + 100 * Math.sin(angle)
                  return (
                    <div
                      key={`hour-${i}`}
                      className="absolute text-lg font-semibold text-slate-700"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {i === 0 ? 12 : i}
                    </div>
                  )
                })}

                {/* Center dot */}
                <div className="absolute left-1/2 top-1/2 h-4 w-4 rounded-full bg-violet-600" style={{ transform: 'translate(-50%, -50%)' }} />

                {/* Hour hand */}
                <div
                  className="absolute left-1/2 top-1/2 w-1 h-16 origin-center rounded-full bg-slate-700"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${(hour % 12) * 30 + minute * 0.5}deg) translateY(-32px)`,
                  }}
                />

                {/* Minute hand */}
                <div
                  className="absolute left-1/2 top-1/2 w-0.5 h-20 origin-center rounded-full bg-violet-600"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${minute * 6}deg) translateY(-40px)`,
                  }}
                />
              </div>

              {/* Digital Display */}
              <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')} {period}
                </div>
              </div>
            </div>

            {/* Input controls */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Hour</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={hour}
                  onChange={handleHourChange}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Minute</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={handleMinuteChange}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'AM' | 'PM')}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-violet-500 focus:outline-none"
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClockTimePicker
