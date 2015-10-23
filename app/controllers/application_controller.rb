class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :null_session

  def holdingPath
    "/usr/local/holding"
  end

  def categoryPath(params)
    # Sanitize directory path component:
    category = params[:category].gsub(/\W/, '')

    # Build full path:
    "#{holdingPath}/#{category}"
  end

  def jobPath(params)
    # Sanitize directory path component:
    job = params[:job].gsub(/\W/, '')

    # Build full path:
    "#{categoryPath(params)}/#{job}"
  end
end
