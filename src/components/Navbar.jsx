function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Transcriber</h1>
          </div>
          <div>
            <span className="text-gray-600 text-sm font-medium">
              Audio Processing Tool
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;