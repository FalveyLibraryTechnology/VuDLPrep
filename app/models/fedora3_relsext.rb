require 'rexml/document'
require 'rexml/xpath'

class Fedora3Relsext
  def initialize(xml)
    @xml = REXML::Document.new xml
    @namespaces = {
      'rdf' => 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      'fedora-model' => 'info:fedora/fedora-system:def/model#',
      'vudl-rel' => 'http://vudl.org/relationships#'
    }
  end

  def sort
    REXML::XPath.first(@xml, "//vudl-rel:sortOn/text()", @namespaces)
  end
end