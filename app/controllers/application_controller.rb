class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  def getDirFromParams(params)
    # Sanitize directory path components:
    category = params[:category].gsub(/\W/, '')
    job = params[:job].gsub(/\W/, '')

    # Build full path:
    "/usr/local/holding/#{category}/#{job}"
  end
end
