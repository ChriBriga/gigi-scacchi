export function Logo({ size = 44, text = true }: { size?: number; text?: boolean }) {
  return (
    <div className="logo">
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} width={size} height={size} alt="" />
      {text && (
        <span className="logo-text">
          Gigi <b>Scacchi</b>
        </span>
      )}
    </div>
  )
}
