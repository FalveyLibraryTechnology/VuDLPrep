class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  #protect_from_forgery with: :exception

  def holdingDir
    "/usr/local/holding"
  end

  def getDirFromParams(params)
    # Sanitize directory path components:
    category = params[:category].gsub(/\W/, '')
    job = params[:job].gsub(/\W/, '')

    # Build full path:
    "#{holdingDir}/#{category}/#{job}"
  end
end
